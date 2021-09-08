all:
	npm install
	npm run build
	mkdir -p public
	cp dist/* public
	dfx deploy --network=ic --no-wallet
