from z3 import *

MAX_SANE_AMOUNT = (2**128) - 1
MIN_SANE_AMOUNT = 2
MAX_PRICE = 1000000000


def Min(a, b):
    return If(a <= b, a, b)

def Max(a, b):
    return If(a >= b, a, b)


def constrainAmount(s, x):
    s.add(x >= 0, x <= MAX_SANE_AMOUNT)

def constrainPosition(s, x):
    s.add(x >= -2**255, x < 2**255 - 1)

def constrainDir(s, x):
    s.add(Or(x == 0, x == 1))

def constrainPrice(s, x):
    s.add(x > 0, x < MAX_PRICE)



def trade(s, params):
    amount, orderAmount, orderDir, orderPrice, takerBalance, makerBalance = Ints('amount orderAmount orderDir orderPrice takerBalance makerBalance')
    oldLongPosition, oldShortPosition = Ints('oldLongPosition oldShortPosition')

    constrainAmount(s, amount)
    constrainAmount(s, orderAmount)
    constrainAmount(s, takerBalance)
    constrainAmount(s, makerBalance)
    constrainDir(s, orderDir)
    constrainPrice(s, orderPrice)

    constrainPosition(s, oldLongPosition)
    constrainPosition(s, oldShortPosition)

    if params.get("oldLongPosition"): params["oldLongPosition"](s, oldLongPosition)
    if params.get("oldShortPosition"): params["oldShortPosition"](s, oldShortPosition)


    longAmount = If(orderDir == 0, amount, orderAmount)
    shortAmount = If(orderDir == 0, orderAmount, amount)

    longBalance = If(orderDir == 0, takerBalance, makerBalance)
    shortBalance = If(orderDir == 0, makerBalance, takerBalance)


    longAmount = Min(longAmount, computeEffectiveBalance(longBalance, oldLongPosition, orderPrice, True))
    shortAmount = Min(shortAmount, computeEffectiveBalance(shortBalance, oldShortPosition, orderPrice, False))

    s.add(longAmount >= MIN_SANE_AMOUNT)
    s.add(shortAmount >= MIN_SANE_AMOUNT)


    longAmount, shortAmount = computePriceWeightedAmounts(longAmount, shortAmount, orderPrice)

    s.add(longAmount >= MIN_SANE_AMOUNT)
    s.add(shortAmount >= MIN_SANE_AMOUNT)


    newLongPosition = oldLongPosition + (longAmount + shortAmount);
    newShortPosition = oldShortPosition - (longAmount + shortAmount);


    if params.get("newLongPosition"): params["newLongPosition"](s, newLongPosition)
    if params.get("newShortPosition"): params["newShortPosition"](s, newShortPosition)


    longBalanceDelta = If(oldLongPosition < 0,
                          priceDivide(-oldLongPosition + Min(0, newLongPosition), MAX_PRICE - orderPrice),
                          0) - \
                       If(newLongPosition > 0,
                          priceDivide(newLongPosition - Max(0, oldLongPosition), orderPrice),
                          0)

    shortBalanceDelta = If(oldShortPosition > 0,
                           priceDivide(oldShortPosition - Max(0, newShortPosition), orderPrice),
                           0) - \
                        If(newShortPosition < 0,
                           priceDivide(-newShortPosition + Min(0, oldShortPosition), MAX_PRICE - orderPrice),
                           0)


    exposureDelta = computeExposureDelta(longBalanceDelta, shortBalanceDelta, oldLongPosition, newLongPosition, oldShortPosition, newShortPosition)

    if params.get("exposureDelta"): params["exposureDelta"](s, exposureDelta)

    ## adjustment-logic

    #newLongPosition = If(exposureDelta == 1, newLongPosition - 1, newLongPosition) 
    #newShortPosition = If(exposureDelta == 1, newShortPosition + 1, newShortPosition) 

    #longBalanceDelta = If(exposureDelta == -1, longBalanceDelta + 1, longBalanceDelta) 

    #exposureDelta = computeExposureDelta(longBalanceDelta, shortBalanceDelta, oldLongPosition, newLongPosition, oldShortPosition, newShortPosition)

    #s.add(exposureDelta == 0)



def computeEffectiveBalance(balance, position, price, isLong):
    return balance + \
           If(isLong,
              If(position < 0, priceDivide(-position, price), 0),
              If(position > 0, priceDivide(position, MAX_PRICE - price), 0))


def priceDivide(amount, price):
    return (amount * price) / MAX_PRICE


def computePriceWeightedAmounts(longAmount, shortAmount, price):
    totalLongAmount = longAmount + ((longAmount * (MAX_PRICE - price)) / price)
    totalShortAmount = shortAmount + ((shortAmount * price) / (MAX_PRICE - price))

    outputLongAmount = If(totalLongAmount > totalShortAmount, totalShortAmount - shortAmount, longAmount)
    outputShortAmount = If(totalLongAmount > totalShortAmount, shortAmount, totalLongAmount - longAmount)

    return (outputLongAmount, outputShortAmount)


def computeExposureDelta(longBalanceDelta, shortBalanceDelta, oldLongPosition, newLongPosition, oldShortPosition, newShortPosition):
    positionDelta1 = If(newLongPosition > 0,
                        newLongPosition - Max(0, oldLongPosition),
                        0) \
                     - If(oldShortPosition > 0,
                        oldShortPosition - Max(0, newShortPosition),
                        0)

    return positionDelta1 + longBalanceDelta + shortBalanceDelta



def proveImpossible(params):
    print params["desc"], " ..."

    #s = Then('simplify','smt').solver()
    #s = Then('simplify', 'nla2bv', 'smt').solver()
    s = Then('simplify', 'qfnra-nlsat').solver()
    trade(s, params)
    res = s.check()

    if res == 'sat': print s.model()

    if params.get('sexpr'): print s.sexpr()

    strRes = str(res)
    if strRes == "unsat": print "    -> OK"
    else: raise Exception("FAIL, expected unsat, got: " + strRes)




proveImpossible({
    'desc': 'exposureDelta cannot be less than -1',
    'exposureDelta': lambda s, x: s.add(x <= -2),
})

proveImpossible({
    'desc': 'exposureDelta cannot be greater than 1',
    'exposureDelta': lambda s, x: s.add(x >= 2),
})

proveImpossible({
    'desc': 'All 0 initial positions can never have exposureDelta of -1',
    'oldShortPosition': lambda s, x: s.add(x == 0),
    'oldLongosition': lambda s, x: s.add(x == 0),
    'exposureDelta': lambda s, x: s.add(x == -1),
})

proveImpossible({
    'desc': 'Positive newShortPosition can never have exposureDelta of 1',
    'newShortPosition': lambda s, x: s.add(x >= 0),
    'exposureDelta': lambda s, x: s.add(x == 1),
})
