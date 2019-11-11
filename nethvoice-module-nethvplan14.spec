Name: nethvoice-module-nethvplan14
Version: 14.2.2
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
* Mon Nov 11 2019 Stefano Fancello <stefano.fancello@nethesis.it> - 14.2.2-1
- Fix audio upload saving nethesis/dev#5730

* Mon Jul 15 2019 Stefano Fancello <stefano.fancello@nethesis.it> - 14.2.1-1
- Fix advanced links for routes with symbols nethesis/dev#5674
- Make inbound routes numbers validation like FreePBX does

* Mon Apr 29 2019 Stefano Fancello <stefano.fancello@nethesis.it> - 14.2.0-1
- Accept same characters as FreePBX does in objects name nethesis/dev#5586
- Restyle to work well with different browsers nethesis/dev#5606
- Don't overwrite dialplan objects when editing them nethesis/dev#5606

* Mon Jan 07 2019 Stefano Fancello <stefano.fancello@nethesis.it> - 14.1.4-1
- Add tts fail if api returns 200 but false nethesis/dev#5529

* Mon Nov 12 2018 Stefano Fancello <stefano.fancello@nethesis.it> - 14.1.2-1
- Add tts to create audio nethesis/dev#5491

* Mon Oct 08 2018 Stefano Fancello <stefano.fancello@nethesis.it> - 14.1.1-1
- Fix filter group and queue list on save nethesis/dev#5469

* Wed May 16 2018 Stefano Fancello <stefano.fancello@nethesis.it> - 14.1.0-1
- Remove obsolete night service nethesis/dev#5399
- Remove obsolete extensions creation nethesis/dev#5398
- Ring groups: configure Ring Time and Ring Strategy. nethesis/dev#5392
- Queues: configure Ring Strategy, Max Wait Time and Agent Timeout. nethesis/dev#5392
- Time Conditions: create/modify Time Groups. nethesis/dev#5392
- Announcement - IVR - CQR: allow to upload or record messages from browser. nethesis/dev#5392
- Added link to FreePBX configuration page on objects. nethesis/dev#5392
- Add username beside extension number in Call Groups and Queues. nethesis/dev#5392
- Add user name beside the extension number in callgroup & queue

* Mon Mar 19 2018 Stefano Fancello <stefano.fancello@nethesis.it> - 14.0.3-1
- Version bump

* Mon Mar 12 2018 Stefano Fancello <stefano.fancello@nethesis.it> - 14.0.2-1
- Remove obsoletes for 11 version

* Thu Mar 01 2018 Stefano Fancello <stefano.fancello@nethesis.it> - 14.0.1-1
- Change name nethvoice-module-nethvplan -> nethvoice-module-nethvplan14

* Fri Feb 23 2018 Stefano Fancello <stefano.fancello@nethesis.it> - 14.0.0-1
- Separated nethvoice-module-nethvplan RPM from nethserver-nethvoice14. Nethesis/dev#5341
- Add CQR to Visual Plan. Nethesis/dev#5339
- Readded translations. Nethesis/dev#5336
- Create select extensions lists and add new route button. Nethesis/dev#5338
- Fix group # numbers, ivr note and queues. Nethesis/dev#5326

