# Visual Plan 

This package installs and configures Visual Plan FreePBX module and UI.

## Building

Launch `./retrieve_modules.sh <GPG-KEY-ASH> <PASSPHRASE>`

You need a valid key verified from FreePBX https://wiki.freepbx.org/pages/viewpage.action?pageId=29753662
This script download and sign all the modules. When it finishes, you can launch make-rpms as usual:

`export dist=ns7;export mockcfg=nethserver-7-x86_64; make-rpms nethserver-nethvoice14.spec`

