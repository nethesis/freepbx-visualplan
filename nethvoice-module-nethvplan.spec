Name:		nethvoice-module-nethvplan
Version: 	0.0.1
Release: 	1%{dist}
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
