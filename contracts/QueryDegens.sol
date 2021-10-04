pragma solidity ^0.7.6;

interface IERC20Token {
    function balanceOf(address tokenOwner) external view returns (uint balance);
    function allowance(address tokenOwner, address spender) external view returns (uint remaining);
    function transfer(address to, uint tokens) external returns (bool success);
    function transferFrom(address from, address to, uint tokens) external returns (bool success);
}

interface DegensInterface {
    function testOrder(uint[4] calldata packed) external view returns(uint256, uint256);
    function getCancelTimestamp(address account) external view returns(uint);
}

contract QueryDegens {
    function testOrderBatch(address degensAddress, uint[4][] memory orders) public view returns (uint[] memory, uint[] memory) {
        DegensInterface degens = DegensInterface(degensAddress);

        uint[] memory available = new uint[](orders.length);
        uint[] memory filled = new uint[](orders.length);
        
        for (uint i = 0; i < orders.length; i++) {
            (available[i], filled[i]) = degens.testOrder(orders[i]);
        }

        return (available, filled);
    }

    function tokenBalancesAndApprovals(address degensAddress, address[] memory accounts, address[] memory tokens) public view returns (uint[] memory) {
        uint[] memory output = new uint[](accounts.length * tokens.length * 2);

        uint curr = 0;
        for (uint i = 0; i < accounts.length; i++) {
            for (uint j = 0; j < tokens.length; j++) {
                output[curr++] = IERC20Token(tokens[j]).balanceOf(accounts[i]);
                output[curr++] = IERC20Token(tokens[j]).allowance(accounts[i], degensAddress);
            }
        }

        return output;
    }

    function queryAccounts(address degensAddress, address[] memory accounts, address[] memory tokens) public view returns (uint[] memory, uint[] memory) {
        DegensInterface degens = DegensInterface(degensAddress);

        uint[] memory balances = tokenBalancesAndApprovals(degensAddress, accounts, tokens);
        uint[] memory cancelTimestamps = new uint[](accounts.length);

        for (uint i = 0; i < accounts.length; i++) {
            cancelTimestamps[i] = degens.getCancelTimestamp(accounts[i]);
        }

        return (balances, cancelTimestamps);
    }
}
