all:
	npm run build
	npm install
	mkdir -p public
	cp dist/* public
	dfx deploy --network=ic --no-wallet
