#!/bin/bash -e

if [[ $# < 2 ]]; then
    echo "Usage: ./retrieve_modules.sh <GPG-KEY-ASH> <PASSPHRASE>"
    exit 2
fi

GPGASH=$1
PASSPHRASE=$2

rm -fr visualplan.tar.gz

# Sign the module
if [[ -n "${PASSPHRASE}" ]]; then
	export GPG_PASSPHRASE=${PASSPHRASE}
	./sign.php module/ $GPGASH
else
    echo "Missing passphrase, not signing the module"
fi

# Pack the module
tar czpf visualplan.tar.gz module

