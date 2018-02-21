#!/bin/bash
if [[ $# < 2 ]]; then
    echo "Usage: ./retrieve_modules.sh <GPG-KEY-ASH> <PASSPHRASE>"
    exit 2
fi

GPGASH=$1
PASSPHRASE=$2

rm -fr visualplan.tar.gz

# Compile transloations
for PO in $(find module -name "*\.po" | grep 'i18n\/[a-z][a-z]_[A-Z][A-Z]')
    do msgfmt -o $(echo ${PO} | sed 's/\.po$/.mo/g') ${PO}
done

# Sign the module 
[[ -n "${PASSPHRASE}" ]] && /usr/bin/expect <<EOD
spawn ./sign.php module/ $GPGASH
expect "Enter passphrase:"
send "$PASSPHRASE\n"
expect eof
EOD

# Pack the module
tar czpf visualplan.tar.gz module

