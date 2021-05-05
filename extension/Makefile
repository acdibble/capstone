build:
	./node_modules/.bin/tsc

clean:
	rm -rf dist tsconfig.tsbuildinfo extension.zip

fresh: clean build

bundle: build
	rm extension.zip &> /dev/null || true
	zip -r extension.zip assets dist manifest.json

watch:
	./node_modules/.bin/nodemon ./node_modules/.bin/tsc --watch src -e ts
