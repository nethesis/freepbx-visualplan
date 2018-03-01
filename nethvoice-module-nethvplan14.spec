Name: nethvoice-module-nethvplan14
Version: 14.0.0
Release: 1%{?dist}
Summary: Visualplan for NethVoice14
Group: Network
License: GPLv2
Source0: %{name}-%{version}.tar.gz
Source1: visualplan.tar.gz
BuildRequires: nethserver-devtools
Buildarch: noarch
Conflicts: nethserver-nethvoice

%description
Visualplan for NethVoice14

%prep
%setup


%build
perl createlinks

%install
rm -rf %{buildroot}
(cd root; find . -depth -print | cpio -dump %{buildroot})
mkdir -p %{buildroot}/usr/src/nethvoice/modules
mv %{S:1} %{buildroot}/usr/src/nethvoice/modules/

%{genfilelist} %{buildroot} \
> %{name}-%{version}-filelist


%clean
rm -rf %{buildroot}

%files -f %{name}-%{version}-filelist
%defattr(-,root,root,-)
%dir %{_nseventsdir}/%{name}-update
%doc

%changelog
* Fri Feb 23 2018 Stefano Fancello <stefano.fancello@nethesis.it> - 14.0.0-1
- Separated nethvoice-module-nethvplan RPM from nethserver-nethvoice14. Nethesis/dev#5341
- Add CQR to Visual Plan. Nethesis/dev#5339
- Readded translations. Nethesis/dev#5336
- Create select extensions lists and add new route button. Nethesis/dev#5338
- Fix group # numbers, ivr note and queues. Nethesis/dev#5326

