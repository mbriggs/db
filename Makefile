.DEFAULT_GOAL:=build

stats:
	cloc --exclude-dir=.idea,node_modules .

clean:
	find src tests | grep '\.js$$\|\.d\.ts$$' | xargs -r rm
	rm -rf dist

build: test clean
	yarn run build
	mkdir -p dist
	cd src && cp -R * ../dist
	cp package.json dist

test: clean
	yarn test

test.w:
	reflex -d none -r '\.ts$$' -- make test

publish: build
	cd dist && npm publish
	make clean