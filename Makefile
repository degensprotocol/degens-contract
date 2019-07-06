SOLC ?= solc


## Build and test

.PHONY: all clean test run_tests fuzz

all: build/degensContractLib.js build/Degens.json build/TestToken.json build/QueryDegens.json

clean:
	rm -rf build/ artifacts/ contracts-temp-build/ coverage/ .node-xmlhttprequest*

test: all build/degensContractLib.js check_requires run_tests

run_tests:
	set -e ; for file in `ls -1 t/*.js | sort`; do echo "------- TEST:" $$file "-------"; node $$file; done
	@echo
	@echo ALL TESTS PASSED.
	@echo

check_requires:
	egrep 'require|revert' contracts/Degens.sol | perl -ne 'die "require/revert without DERR: $$_" unless /(DERR_\w+)/; die "DERR too long: $$1: " . length($$1) if length($$1) > 32; die "duplicate DERR: $$1" if $$seen{$$1}++;'

build/Degens.json: contracts/*.sol
	mkdir -p build/
	$(SOLC) --optimize --combined-json abi,bin contracts/Degens.sol > build/Degens.json.tmp
	mv build/Degens.json.tmp build/Degens.json

build/TestToken.json: contracts/TestToken.sol
	mkdir -p build/
	$(SOLC) --optimize --combined-json abi,bin contracts/TestToken.sol > build/TestToken.json.tmp
	mv build/TestToken.json.tmp build/TestToken.json

build/QueryDegens.json: contracts/QueryDegens.sol
	mkdir -p build/
	$(SOLC) --optimize --combined-json abi,bin contracts/QueryDegens.sol > build/QueryDegens.json.tmp
	mv build/QueryDegens.json.tmp build/QueryDegens.json

build/degensContractLib.js: jslib/degensContractLib.js
	mkdir -p build/
	./node_modules/.bin/babel jslib/degensContractLib.js --plugins=@babel/transform-modules-commonjs --out-file build/degensContractLib.js


## Coverage

.PHONY: install_coverage_deps build_coverage render_coverage_report coverage

install_coverage_deps:
	npm i @0x/sol-coverage @0x/sol-profiler @0x/sol-trace istanbul istanbul-combine

build_coverage:
	rm -rf coverage/ contracts-temp-build/
	cp -r contracts/ contracts-temp-build/
	perl -pi -e 's{require\((.*), (".*")\);}{if (!($$1)) revert($$2);}' contracts-temp-build/*.sol
	./node_modules/.bin/sol-compiler

render_coverage_report:
	./node_modules/.bin/istanbul-combine -r html coverage/*.json

coverage: export USE_SOL_COVERAGE=1
coverage: build_coverage run_tests render_coverage_report
