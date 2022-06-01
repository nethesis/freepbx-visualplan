Name: nethvoice-module-nethvplan14
Version: 14.3.5
Release: 1%{?dist}
Summary: Visualplan for NethVoice14
Group: Network
License: GPLv2
Source0: %{name}-%{version}.tar.gz
Source1: visualplan.tar.gz
BuildRequires: nethserver-devtools
Buildarch: noarch
Conflicts: nethserver-nethvoice
Requires: nethserver-freepbx

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
* Wed Jun 01 2022 Sebastian <sebastian.besel@nethesis.it> - 14.3.5-1
- Error with file audio upload - Bug nethesis/dev#6158

* Mon May 16 2022 Sebastian <sebastian.besel@nethesis.it> - 14.3.4-1
- New button for capturing the visual plan section - nethesis/dev#6126

* Fri Mar 11 2022 Stefano Fancello <stefano.fancello@nethesis.it> - 14.3.3-1
- Visual Plan - stat reset on queue always set to no - Bug nethesis/dev#6078
- Visualplan - Enable lazy mebers on queue always set to no - Bug nethesis/dev#6079

* Thu Oct 21 2021 Stefano Fancello <stefano.fancello@nethesis.it> - 14.3.2-1
- Visual Plan: Queue Join Announcement is deleted by Visual Plan save action - Bug nethesis/dev#5997

* Thu Jul 22 2021 Stefano Fancello <stefano.fancello@nethesis.it> - 14.3.1-1
- Some packages aren't correctly removed with NethVoice - Bug nethesis/dev#6044
- Wrong alertinfo string - Bug nethesis/dev#6036

* Tue Oct 20 2020 SebastianMB-IT <sebastian.besel@nethesis.it> - 14.3.0-1
- Dial Options switch is overwritten in extensions after saving - Bug nethesis/dev#5890
- Modifying a temp group isn't possible to delete a temp interval - Bug nethesis/dev#5891
- The link to the Advanced Settings is missing in the CQR - Bug nethesis/dev#5892
- The input of the new option in the CQR and IVR isn't alphanumeric - Bug nethesis/dev#5893
- Convert users's select type to a multiple select in groups and queues - nethesis/dev#5879
- Pressing ENTER on IVR option input reloads the window - Bug nethesis/dev#5878
- Enable "Enable Call Pickup" and "Mark Answered Elsewhere" by default in groups and queues - nethesis/dev#5877
- Dates mismatch in Visual Plan during Temporal Groups creation and edit - Bug nethesis/dev#5863
- Set yes as default of Force Answer and Signal RINGING in the new Incoming Routes - nethesis/dev#5876
- Unmanaged parameters are reset to default values in the Visual Plan - Bug nethesis/dev#5864

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

