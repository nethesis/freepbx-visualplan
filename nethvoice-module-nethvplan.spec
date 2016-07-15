Name:		nethvoice-module-nethvplan
Version: 1.0.6
Release: 1%{?dist}
Summary:	A module to visualize and edit FreePBX dialplan
Group:		Networking/Daemons	
License:	GPL	
Source0:	%{name}-%{version}.tar.gz
BuildRoot:	%(mktemp -ud %{_tmppath}/%{name}-%{version}-%{release}-XXXXXX)
BuildArch:	noarch
Autoreq:	no
BuildRequires:  nethserver-devtools	
BuildRequires:  gettext
Requires:   	nethserver-nethvoice
Requires: 	nethserver-nethvoice-enterprise

%description
A module to visualize and edit FreePBX dialplan

%prep
%setup 


%build
for PO in $(find root -name "*\.po" | grep 'i18n\/')
    do msgfmt -o $(echo ${PO} | sed 's/\.po$/.mo/g') ${PO}
    /bin/rm ${PO}
done
perl createlinks

%install
rm -rf $RPM_BUILD_ROOT
(cd root ; find . -depth -print | cpio -dump $RPM_BUILD_ROOT)

/sbin/e-smith/genfilelist $RPM_BUILD_ROOT > %{name}-%{version}-filelist


%clean
rm -rf $RPM_BUILD_ROOT

%files -f %{name}-%{version}-filelist
%defattr(-,asterisk,asterisk)

%changelog
* Fri Jul 15 2016 Alessandro Polidori <alessandro.polidori@nethesis.it> - 1.0.6-1
- ringgroup. fix creation with multiple extensions. Refs #4195

* Fri May 27 2016 Stefano Fancello <stefano.fancello@nethesis.it> - 1.0.5-1
- Fix reset field of object on save. Refs #4150

* Mon Mar 14 2016 Stefano Fancello <stefano.fancello@nethesis.it> - 1.0.3-1
- Add support for vplan in home. Refs #4064

* Fri Feb 26 2016 Stefano Fancello <stefano.fancello@nethesis.it> - 1.0.2-1
- use relative path. Refs #4059

* Wed Dec 09 2015 Stefano Fancello <stefano.fancello@nethesis.it> - 1.0.1-1
- Move Visual Plan in Base Objects
- fix empty incoming route with night service
- added nethvplan prefix to all functions

* Wed Sep 30 2015 Stefano Fancello <stefano.fancello@nethesis.it> - 1.0.0-1
- added default random secret to extension. Refs #3856
- added device insert with user insert. Refs #3856
- added default timeout to IVR and remove dot at the end of the incoming route. Refs #3856
- night service. fixed timestamp error
- core. added nethnight control on remove
- ivr. improved option add and delete
- improved modification for extension, conference and night service
- finished modification part with all popup elements
- added modifiy dialog for each components
- fixed infinte loop on object creation
- refactor code
- core. deleted duplicate entries on saved

