all:
	+$(MAKE) -C kv_store
	+$(MAKE) -C key_sync
	+$(MAKE) -C frontend
