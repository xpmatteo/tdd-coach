
.PHONY: dev
dev:
	scripts/shoreman.sh

.PHONY: tail-log
tail-log:
	@tail -100 ./dev.log | perl -pe 's/\e\[[0-9;]*m(?:\e\[K)?//g'
