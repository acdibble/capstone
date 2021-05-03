build:
	npx tsc

clean:
	rm -rf dist tsconfig.tsbuildinfo extension.zip

fresh: clean build

bundle: build
	rm extension.zip
	zip -r extension.zip assets dist manifest.json
