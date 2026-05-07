const state = {
  loggedIn: sessionStorage.getItem('wedding-dashboard-auth') === '1',
  route: location.hash.replace('#', '') || 'home',
  menuOpen: false,
  timelineMode: 'team-0',
  selectedSlot: 0,
  videographerSame: true,
  linkPopup: false,
  linkPopupIndex: null,
  teamNamePopup: false,
  teamNameIndex: null,
  confirmAction: null,
  addCardPopup: false,
  editTitleAfterRender: false,
  customSlotNamePopup: false,
  locationPopup: false,
  suppressLocationPopup: false,
  locationQuery: '',
  savedLocations: [],
  googlePlacesReady: false,
  googlePlacesLoading: false,
  paymentMethod: 'credit-card',
  paymentAmount: '',
  eventInfoEditing: false,
  eventInfoPhoto: '',
  eventInfoPhotoX: 50,
  eventInfoPhotoY: 50,
  eventInfoPhotoDrag: null,
  eventInfoPhotoMoved: false,
  eventInfo: {
    eventDate: 'September 28, 2014',
    venue: 'The Foundry, Long Island City',
    phones: 'Rachel: 917.555.0124\nMichael: 917.555.0188',
    emails: 'rachel@example.com\nmichael@example.com',
    address: '123 Brooklyn Ave, Brooklyn, NY 11201'
  },
  teamMembers: ['Photographer'],
  shortSlots: [],
  vendors: [
    ['Event planner', 'Bride and blossom', 'www.brideandblossom.com', 'info@brideandblossom.com'],
    ['Florist', '', '', ''],
    ['DJ/Band', '', '', 'DJ/Bands email'],
    ['Officiant/Reverend', '', 'Officiant/Reverends website', ''],
    ['Hair/Makeup', '', 'Hair/Makeup website', '']
  ],
  teamTimelines: [],
  timeline: [
    ['0:00', '0:00', 'GETTING READY - SPOUSE 1', 'Time range', '', false],
    ['0:00', '0:00', 'GETTING READY - SPOUSE 2', 'Time range', '', false],
    ['0:00', '0:00', 'FIRST LOOK', 'Time range', '', false],
    ['0:00', '0:00', 'COUPLE PORTRAITS', 'Time range', '', false],
    ['0:00', '0:00', 'BRIDAL PARTY PORTRAITS', 'Time range', '', false],
    ['0:00', '0:00', 'FAMILY PORTRAITS', 'Time range', '', false],
    ['0:00', '0:00', 'CEREMONY', 'Time range', '', false],
    ['0:00', '0:00', 'COCKTAIL HOUR', 'Time range', '', false],
    ['0:00', '0:00', 'RECEPTION', 'Time range', '', false],
    ['0:00', '0:00', 'PHOTOGRAPHER LEAVES', 'Time range', '', false]
  ]
};

const app = document.querySelector('#app');
const routes = ['home', 'vendors', 'timeline', 'misc', 'payments', 'faq', 'contact'];
const defaultTimelineCards = ['GETTING READY - SPOUSE 1','GETTING READY - SPOUSE 2','FIRST LOOK','COUPLE PORTRAITS','BRIDAL PARTY PORTRAITS','FAMILY PORTRAITS','CEREMONY','COCKTAIL HOUR','RECEPTION','PHOTOGRAPHER LEAVES'];

function cloneTimeline(timeline) {
  return timeline.map(slot => Array.isArray(slot) ? slot.map(item => (item && typeof item === 'object' ? {...item} : item)) : slot);
}
function emptyTimeline() {
  return defaultTimelineCards.map(title => ['0:00', '0:00', title, 'Time range', '', false]);
}
function activeTeamIndex() {
  return Math.max(0, Number(String(state.timelineMode).replace('team-', '')) || 0);
}
function syncActiveTimeline() {
  let index = activeTeamIndex();
  if (!state.teamMembers[index]) index = 0;
  state.timelineMode = `team-${index}`;
  state.teamTimelines[index] ||= emptyTimeline();
  state.timeline = state.teamTimelines[index];
  state.selectedSlot = Math.max(0, Math.min(state.selectedSlot, state.timeline.length - 1));
}
state.teamTimelines = [state.timeline];

const params = new URLSearchParams(location.search);
state.isAdmin = params.get('role') === 'admin' || params.get('admin') === '1' || (params.get('preview') === '1' && params.get('role') !== 'client' && params.get('admin') !== '0');
if (params.get('preview') === '1') {
  state.loggedIn = true;
  state.route = params.get('route') || state.route;
  if (params.has('team') && state.teamMembers[Number(params.get('team'))]) state.timelineMode = `team-${params.get('team')}`;
  if (params.has('clock')) setTimeout(() => openTimeWheel(params.get('clock')), 0);
}
syncActiveTimeline();

function fit() {
  // Match the supplied 2549px wide design canvas. Scale by the usable viewport
  // width, not window.innerWidth. innerWidth includes the vertical scrollbar,
  // which made the scaled artboard a few pixels too wide and created page-level
  // horizontal scrollbars.
  const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
  const scale = viewportWidth / 2549;
  document.documentElement.style.setProperty('--scale', Math.max(scale, 0.2));
}
window.addEventListener('resize', () => { fit(); syncHomeGridHeight(); });
fit();

function render() {
  document.body.className = `body-${screenName()} ${state.isAdmin ? 'is-admin' : 'is-client'}`;
  document.documentElement.style.background = screenName() === 'home' ? '#ebf5fd' : '#ebf5fd';
  if (!state.loggedIn) app.innerHTML = box(signIn());
  else if (state.route === 'home') app.innerHTML = box(home());
  else app.innerHTML = box(shell(content(state.route)));
  bind();
  syncHomeGridHeight();
  requestAnimationFrame(() => {
    fit();
    syncHomeGridHeight();
  });
}
function screenName() {
  if (!state.loggedIn) return 'signin';
  return state.route || 'home';
}
function box(html) { return `<div class="fit-box screen-${screenName()}"><section class="artboard screen-${screenName()}">${html}</section></div>`; }

function signIn() {
  return `<section class="signin">
    <div class="abs sign-title">eventdashboard</div>
    <div class="abs sign-welcome">Welcome!</div>
    <p class="abs sign-copy">Lorem ipsum dolor sit amet, consectetur adipisicing</p>
    <form id="signin-form">
      <div class="abs sign-form-title">Sign in</div>
      <label class="abs sign-label sign-user-label">Username</label><input class="abs hairline sign-input sign-user" name="username" required>
      <label class="abs sign-label sign-pass-label">Password</label><input class="abs hairline sign-input sign-pass" name="password" type="password" required>
      <button class="abs blue-btn sign-button">Sign in</button>
      <p class="abs sign-help">If you forgot your password, just contact us.</p>
    </form>
  </section>`;
}

function sidebarMarkup(classes = 'abs home-left') {
  return `<aside class="${classes}"><div class="sidebar-brand"><div class="logo-box">LI</div></div><nav class="sidebar-menu"><div class="sidebar-section"><div class="sidebar-section-title">Event Info</div><button data-route="home"><span class="sidebar-icon">◼</span><span>Event details</span></button><button data-route="vendors"><span class="sidebar-icon">◎</span><span>Event vendors</span></button><button data-route="timeline"><span class="sidebar-icon">◷</span><span>Event Timeline</span></button><button data-route="home"><span class="sidebar-icon">◉</span><span>Video details</span></button><button data-route="misc"><span class="sidebar-icon">✣</span><span>Miscellaneous</span></button></div><div class="sidebar-section"><div class="sidebar-section-title">Photo Book</div><button data-route="home"><span class="sidebar-icon">▣</span><span>Create your album</span></button></div><div class="sidebar-section"><div class="sidebar-section-title">Photo Booth</div><button data-route="home"><span class="sidebar-icon">◈</span><span>Create your monogram</span></button></div><div class="sidebar-section"><div class="sidebar-section-title">QR Code</div><button data-route="home"><span class="sidebar-icon">▦</span><span>Create your QR Code</span></button></div><div class="sidebar-section"><div class="sidebar-section-title">Payments</div><button data-route="payments"><span class="sidebar-icon">▭</span><span>Billing</span></button></div></nav><nav class="sidebar-bottom"><button data-route="faq"><span class="sidebar-icon">●</span><span>FAQ</span></button><button data-route="contact"><span class="sidebar-icon">✉</span><span>Contact us</span></button><button data-route="home"><span class="sidebar-icon">⚙</span><span>Your settings</span></button></nav></aside>`;
}
function side() { return sidebarMarkup('abs side home-left'); }
function nav(route, label) { return `<button class="${state.route === route ? 'active' : ''}" data-route="${route}">${label}</button>`; }
function eventInfoBox() {
  const info = state.eventInfo;
  const editing = state.eventInfoEditing && state.isAdmin;
  const field = (key, label) => {
    const value = info[key] || '';
    const display = String(value).replace(/\n/g, '<br>');
    return `<div><dt>${label}</dt><dd>${editing ? `<textarea data-event-info-field="${key}" rows="2">${value}</textarea>` : display}</dd></div>`;
  };
  const photoStyle = state.eventInfoPhoto ? ` style="--event-info-photo:url('${state.eventInfoPhoto}');--event-info-photo-x:${state.eventInfoPhotoX}%;--event-info-photo-y:${state.eventInfoPhotoY}%;"` : '';
  return `<article class="abs couple-info ${editing ? 'is-editing' : ''}"><button type="button" class="event-info-edit" data-event-info-edit aria-label="${editing ? 'Done editing event info' : 'Edit event info'}">${editing ? '✓' : '<svg viewBox="0 0 494.936 494.936" aria-hidden="true"><path d="M389.844 182.85c-6.743 0-12.21 5.467-12.21 12.21v222.968c0 23.562-19.174 42.735-42.736 42.735H67.157c-23.562 0-42.736-19.174-42.736-42.735V150.285c0-23.562 19.174-42.735 42.736-42.735h267.741c6.743 0 12.21-5.467 12.21-12.21s-5.467-12.21-12.21-12.21H67.157C30.126 83.13 0 113.255 0 150.285v267.743c0 37.029 30.126 67.155 67.157 67.155h267.741c37.03 0 67.156-30.126 67.156-67.155V195.061c0-6.743-5.467-12.211-12.21-12.211z"></path><path d="M483.876 20.791c-14.72-14.72-38.669-14.714-53.377 0L221.352 229.944c-.28.28-3.434 3.559-4.251 5.396l-28.963 65.069c-2.057 4.619-1.056 10.027 2.521 13.6 2.337 2.336 5.461 3.576 8.639 3.576 1.675 0 3.362-.346 4.96-1.057l65.07-28.963c1.83-.815 5.114-3.97 5.396-4.25L483.876 74.169c7.131-7.131 11.06-16.61 11.06-26.692 0-10.081-3.929-19.562-11.06-26.686zM466.61 56.897 257.457 266.05c-.035.036-.055.078-.089.107l-33.989 15.131L238.51 247.3c.03-.036.071-.055.107-.09L447.765 38.058c5.038-5.039 13.819-5.033 18.846.005 2.518 2.51 3.905 5.855 3.905 9.414 0 3.559-1.389 6.903-3.906 9.42z"></path></svg>'}</button><label class="couple-info-photo ${state.eventInfoPhoto ? 'has-event-photo' : ''}" data-event-photo-drop aria-label="Couple photo"${photoStyle}>${editing ? '<input type="file" accept="image/*" data-event-photo-input><span>Drop photo<br>or browse</span>' : ''}</label><div class="couple-info-details"><dl>${field('eventDate','Event date')}${field('venue','Venue')}${field('phones','Phone numbers')}${field('emails','Emails')}${field('address','Mailing address')}</dl></div></article>`;
}
function setEventInfoPhoto(file) {
  if (!file || !file.type?.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = () => { state.eventInfoPhoto = reader.result; state.eventInfoPhotoX = 50; state.eventInfoPhotoY = 50; render(); };
  reader.readAsDataURL(file);
}
function startEventInfoPhotoDrag(e) {
  if (!state.eventInfoEditing || !state.eventInfoPhoto || e.target.matches?.('[data-event-photo-input]')) return;
  e.preventDefault();
  const rect = e.currentTarget.getBoundingClientRect();
  state.eventInfoPhotoMoved = false;
  state.eventInfoPhotoDrag = {pointerId:e.pointerId, startX:e.clientX, startY:e.clientY, baseX:state.eventInfoPhotoX, baseY:state.eventInfoPhotoY, width:rect.width, height:rect.height};
  e.currentTarget.setPointerCapture?.(e.pointerId);
  e.currentTarget.classList.add('is-positioning');
}
function moveEventInfoPhoto(e) {
  const drag = state.eventInfoPhotoDrag;
  if (!drag || drag.pointerId !== e.pointerId) return;
  e.preventDefault();
  const dx = ((e.clientX - drag.startX) / Math.max(1, drag.width)) * 100;
  const dy = ((e.clientY - drag.startY) / Math.max(1, drag.height)) * 100;
  if (Math.abs(e.clientX - drag.startX) > 2 || Math.abs(e.clientY - drag.startY) > 2) state.eventInfoPhotoMoved = true;
  state.eventInfoPhotoX = Math.max(0, Math.min(100, drag.baseX - dx));
  state.eventInfoPhotoY = Math.max(0, Math.min(100, drag.baseY - dy));
  e.currentTarget.style.setProperty('--event-info-photo-x', `${state.eventInfoPhotoX}%`);
  e.currentTarget.style.setProperty('--event-info-photo-y', `${state.eventInfoPhotoY}%`);
}
function endEventInfoPhotoDrag(e) {
  const drag = state.eventInfoPhotoDrag;
  if (!drag || drag.pointerId !== e.pointerId) return;
  e.currentTarget.classList.remove('is-positioning');
  state.eventInfoPhotoDrag = null;
}
function toggleMenu(event) {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  state.menuOpen = !state.menuOpen;
  render();
}
function shell(inner) { return `<section class="dashboard-page ${state.menuOpen ? 'menu-open' : ''}"><button type="button" class="abs menu-toggle" aria-label="Open menu" data-menu-toggle onclick="toggleMenu(event)"><span></span><span></span><span></span></button><button type="button" class="abs menu-click-zone" aria-label="Open menu" onclick="toggleMenu(event)"></button>${side()}<h1 class="abs page-heading">${pageTitle()}</h1><div class="abs content">${inner}</div></section>`; }
function pageTitle() { return ({payments:'Billing', vendors:'Event vendors', timeline:'Event Timeline', misc:'Miscellaneous', faq:'FAQ', contact:'Contact us'})[state.route] || 'Event details'; }

function home() {
  return `<section class="home">
    ${sidebarMarkup('abs home-left')}
    <h1 class="abs client-name">Rachel and Michael Silvermans</h1>
    ${eventInfoBox()}
    <div class="abs event-dashboard-grid">
      <div class="event-left-column">
        <article class="abs package"><h2>Your Package <button type="button" class="package-builder-toggle" data-package-builder-toggle aria-label="Done building package"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg></button></h2><ul class="package-list"></ul><section class="package-builder"><button type="button" class="package-builder-add-day" data-package-builder-add-day aria-label="Add another shoot day" title="Add another shoot day">+</button><div class="package-builder-date-calendar-holder" data-builder-date-calendar-holder></div><p class="package-empty-copy">No package has been added yet. Build the client’s booked package below.</p><div class="package-builder-grid"><button type="button" data-package-build="photo-one">+ One Photographer</button><button type="button" data-package-build="photo-second">+ Second Photographer</button><button type="button" data-package-build="engagement-1">+ Engagement 1 Hour</button><button type="button" data-package-build="engagement-2">+ Engagement 2 Hours</button><button type="button" data-package-build="photo-book-10">+ Photo Book 10x10</button><button type="button" data-package-build="photo-book-12">+ Photo Book 12x12</button><button type="button" data-package-build="photo-book-10-design">+ Photo Book 10x10 + Design</button><button type="button" data-package-build="photo-book-12-design">+ Photo Book 12x12 + Design</button><button type="button" data-package-build="retouch-10">+ Retouching 10</button><button type="button" data-package-build="retouch-20">+ Retouching 20</button><button type="button" data-package-build="retouch-30">+ Retouching 30</button><button type="button" data-package-build="expedited-photo">+ Expedited Photos</button><button type="button" data-package-build="premium-photo-editing">+ Premium Photo Editing</button><button type="button" data-package-build="premium-photo-package">+ Premium Photo Package</button><button type="button" data-package-build="video-one">+ One Videographer</button><button type="button" data-package-build="video-second">+ Second Videographer</button><button type="button" data-package-build="video-cinematography">+ Cinematography</button><button type="button" data-package-build="video-trailer">+ Trailer Only</button><button type="button" data-package-build="video-extended">+ Extended Trailer</button><button type="button" data-package-build="video-traditional">+ Traditional Video</button><button type="button" data-package-build="premium-video-package">+ Premium Video Package</button><button type="button" data-package-build="sneak-photo">+ Sneak Peek Photo</button><button type="button" data-package-build="sneak-video">+ Sneak Peek Video</button><button type="button" data-package-build="sneak-photo-video">+ Sneak Peek Photo & Video</button><button type="button" data-package-build="photo-booth-3">+ Photo Booth Basic</button><button type="button" data-package-build="photo-booth-4">+ Photo Booth All Inclusive</button><button type="button" data-package-build="content-creator">+ Content Creator</button><button type="button" data-package-build="content-package">+ Content Creation Package</button><button type="button" data-package-build="highlight-reel">+ Highlight Reel</button><button type="button" data-package-build="short-reel">+ Short Reel</button></div></section><section class="package-upgrades"><p>These upgrades are available for your current package. Add any upgrade below and your balance will update automatically.</p><div class="upgrade-notice" hidden></div><div class="upgrade-choice-popup" hidden></div><div class="upgrade-card upgrade-card-video-editing" data-upgrade="video-editing"><h4>Edit Your Video / Add Second Videographer</h4><ul><li>Add professional editing to your raw footage package</li><li>Choose trailer, traditional edit, cinematography, extended trailer, or a second videographer</li></ul><button type="button" data-upgrade-choice="video-editing-only" onclick="event.preventDefault(); event.stopPropagation(); openUpgradeChoice('video-editing-only');">add to package</button></div><div class="upgrade-card" data-upgrade="sneak-peek"><h4>Sneak Peek Package <span>$99</span></h4><ul><li>50 Edited Sneak Peek Photos</li><li>Wedding Photo Reel</li><li>7 Business Day Turnaround</li></ul><button type="button" data-upgrade-add="sneak-peek" onclick="event.preventDefault(); event.stopPropagation(); addPackageUpgrade('sneak-peek');">add to package</button></div><div class="upgrade-card" data-upgrade="premium-photo"><h4>Premium Photography Package <span>$299</span></h4><ul><li>Premium Photo Editing Upgrade</li><li>Expedited Processing Upgrade</li><li>Sneak Peek Package, 50 photos within 7 days</li><li>5 Year Online Viewing, Storage, Download Upgrade</li></ul><a href="https://leimageinc.com/premium-photo-package/" target="_blank" rel="noopener">See standard vs premium photo samples</a><button type="button" data-upgrade-add="premium-photo" onclick="event.preventDefault(); event.stopPropagation(); addPackageUpgrade('premium-photo');">add to package</button></div><div class="upgrade-card upgrade-card-video" data-upgrade="premium-video"><h4>Premium Video <span data-dynamic-price="premium-video">$299</span></h4><ul data-premium-video-items><li>Cinematography Sound Upgrade</li><li>1 min. Video Reel</li><li>Expedited Processing Upgrade</li><li>5 Year Online Viewing, Storage, Download Upgrade</li><li>Premium Song Upgrade</li></ul><button type="button" data-upgrade-add="premium-video" onclick="event.preventDefault(); event.stopPropagation(); addPackageUpgrade('premium-video');">add to package</button></div><div class="upgrade-card upgrade-card-video-add" data-upgrade="add-videography"><h4>Add Videography</h4><ul><li>Choose one videographer or add a second videographer</li><li>Availability needs confirmation</li></ul><button type="button" data-upgrade-choice="videography" onclick="event.preventDefault(); event.stopPropagation(); openUpgradeChoice('videography');">add to package</button></div><div class="upgrade-card" data-upgrade="photo-booth"><h4>Photo Booth <span data-dynamic-price="photo-booth-range">$799 / $899</span></h4><ul><li>Choose 3-hour or 4-hour rental</li><li>Includes attendant, prints, backdrop, and props</li><li>Availability needs confirmation</li></ul><button type="button" data-upgrade-choice="photo-booth" onclick="event.preventDefault(); event.stopPropagation(); openUpgradeChoice('photo-booth');">add to package</button></div><div class="upgrade-card" data-upgrade="photo-book"><h4>Photo Book <span>$519 / $569</span></h4><ul><li>Choose 10x10 or 12x12, 30 pages</li><li>DIY album design with our free software</li><li>Professional album design available for $100</li></ul><button type="button" data-upgrade-choice="photo-book" onclick="event.preventDefault(); event.stopPropagation(); openUpgradeChoice('photo-book');">add to package</button></div><div class="upgrade-card" data-upgrade="content-creation"><h4>Content Creation</h4><ul><li>We need to check availability for your event date</li><li>Our studio will get back to you soon</li></ul><button type="button" data-upgrade-choice="content-creation" onclick="event.preventDefault(); event.stopPropagation(); openUpgradeChoice('content-creation');">add to package</button></div></section><div class="package-actions"><button type="button" class="package-action" aria-label="View your contract" title="View your contract"><span class="package-action-icon package-action-view" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"></path><circle cx="12" cy="12" r="2.8"></circle></svg></span><span class="package-action-text">View your contract</span></button><button type="button" class="package-action" aria-label="Download contract" title="Download contract"><span class="package-action-icon package-action-download" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 4v10"></path><path d="M8 10l4 4 4-4"></path><path d="M5 19h14"></path></svg></span><span class="package-action-text">Download contract</span></button></div></article>
        <article class="abs tile tile-content-creation"><h3>Content Creation <span class="addon-badge">Optional add on</span></h3><p class="included-copy">Please complete the content creation questions so our team knows what short-form moments to capture.</p><p class="addon-copy">Content creation is not included in your current package, but you can still request it anytime. We will check availability for your event date.</p><button class="plain-btn included-action" data-route="home">view</button><button class="plain-btn addon-action" type="button" onclick="event.preventDefault(); event.stopPropagation(); openUpgradeChoice('content-creation');">add to package</button></article>
      </div>
      <div class="event-right-grid">
        <article class="abs tile tile-pay"><h3>Payments &amp; Balance</h3><p>Your current balance is $1800.00 due in full by September 28, 2014.</p><button class="plain-btn" data-route="payments">make a payment</button><button type="button" class="tile-plus-action tile-pay-plus-action" data-payment-plus aria-label="Add payment adjustment" onpointerdown="event.preventDefault(); event.stopImmediatePropagation(); togglePaymentPlusPopup();" onclick="event.preventDefault(); event.stopImmediatePropagation();">+</button><div class="payment-plus-popup" data-payment-plus-popup hidden><button type="button" data-payment-option="discount" onpointerdown="event.preventDefault(); event.stopImmediatePropagation(); closePaymentPlusPopup();">Add discount</button><button type="button" data-payment-option="gratuity" onpointerdown="event.preventDefault(); event.stopImmediatePropagation(); closePaymentPlusPopup();">Add gratuity</button><button type="button" data-payment-option="other" onpointerdown="event.preventDefault(); event.stopImmediatePropagation(); closePaymentPlusPopup();">Other</button></div></article>
        <article class="abs tile tile-video-details"><h3>Videography <span class="addon-badge">Optional add on</span></h3><p class="included-copy">Please answer the video questions below so our team knows exactly what to capture and deliver.</p><p class="addon-copy">Video is not included in your current package, but you can still add it anytime. Tell us if you would like video coverage added to your event.</p><button class="plain-btn included-action" data-route="home">view</button><button class="plain-btn addon-action" type="button" onclick="event.preventDefault(); event.stopPropagation(); openUpgradeChoice('videography');">add to package</button></article>
        <article class="abs tile tile-timeline"><h3>Event Timeline</h3><p>The timeline will serve as a guideline for our photographers/videographers on your event day. Please be sure to read our suggestions for each section and assign the time accordingly.</p><button class="plain-btn" data-route="timeline">create</button></article>
        <article class="abs tile tile-photo-booth"><h3>Photo Booth <span class="addon-badge">Optional add on</span></h3><p class="included-copy">Please complete the photo booth questions so we have everything set up correctly for your event.</p><p class="addon-copy">Photo booth is not included in your current package, but you can still add it anytime. Let us know if you would like a booth at your event.</p><button class="plain-btn included-action" data-route="home">create monogram</button><button class="plain-btn addon-action" type="button" onclick="event.preventDefault(); event.stopPropagation(); openUpgradeChoice('photo-booth');">add to package</button></article>
        <article class="abs tile tile-guest-upload"><h3>Guest Upload Link &amp; QR Code</h3><div class="tile-copy"><p>Now your guests can upload photos they take at your event and you can access them all in one place!</p></div><button class="plain-btn" data-route="home">create</button></article>
        <article class="abs tile tile-misc"><h3>Miscellaneous</h3><p>Review important details about gratuity, vendor meals, vendor contacts, and any final notes our team should know before the event.</p><button class="plain-btn" data-route="misc">view</button></article>
        <article class="abs tile tile-book"><h3>Photo Book <span class="addon-badge">Optional add on</span></h3><p class="included-copy">Use our DIY photo book software to design your album when you are ready.</p><p class="addon-copy">Photo book is not included in your current package, but you can still add one anytime. Design it yourself with our DIY album software, or ask us about professional album design.</p><button class="plain-btn included-action" data-route="photobook">create</button><button class="plain-btn addon-action" type="button" onclick="event.preventDefault(); event.stopPropagation(); openUpgradeChoice('photo-book');">add to package</button></article>
      </div>
    </div>
  </section>`;
}
function routeFromLabel(label) { const l=label.toLowerCase(); if(l.includes('vendor')) return 'vendors'; if(l.includes('timeline')) return 'timeline'; if(l.includes('payment')||l.includes('billing')) return 'payments'; if(l.includes('faq')) return 'faq'; if(l.includes('contact')) return 'contact'; return 'home'; }
function tile(cls, title, copy, route) { return `<article class="abs tile ${cls}"><h3>${title}</h3><p>${copy}</p><button class="plain-btn" data-route="${route}">view</button></article>`; }
function packageTeamMembers() {
  const packageText = document.querySelector('.package-list')?.innerText.toLowerCase() || '';
  const selected = new Set(Array.from(document.querySelectorAll('.package-list [data-upgrade-line]')).map(li => li.dataset.upgradeLine));
  const teams = [];
  if (/one photographer|photographer|photography|photo gallery|edited images/.test(packageText) || selected.has('photo-one')) teams.push('Photographer');
  if (/second photographer/.test(packageText) || selected.has('photo-second')) teams.push('Second Photographer');
  if (/one videographer|raw video footage|digital download of high resolution video/.test(packageText) || selected.has('video-one')) teams.push('Videographer');
  if (/second videographer/.test(packageText) || selected.has('video-second')) teams.push('Second Videographer');
  if (/content creator|content creation/.test(packageText) || selected.has('content-creator') || selected.has('content-creation-package')) teams.push('Content Creator');
  return teams.length ? teams : ['Photographer'];
}
function syncTimelineTeamFromPackage() {
  const nextTeams = packageTeamMembers();
  const currentTeams = state.teamMembers || [];
  if (nextTeams.length === currentTeams.length && nextTeams.every((team, index) => team === currentTeams[index])) return;
  const timelineByName = new Map(currentTeams.map((team, index) => [team, state.teamTimelines[index] || emptyTimeline()]));
  state.teamMembers = nextTeams;
  state.teamTimelines = nextTeams.map(team => timelineByName.get(team) || emptyTimeline());
  const currentIndex = activeTeamIndex();
  if (!state.teamMembers[currentIndex]) {
    state.timelineMode = 'team-0';
    state.selectedSlot = 0;
  }
  syncActiveTimeline();
}

function photoChoiceState() {
  window.__photoChoice ||= {date: '', status: 'idle', selected: '', secondSelected: false, hours: {one: 8, second: 8}, calendarMonth: '', calendarOpen: false};
  window.__photoChoice.hours ||= {one: 8, second: 8};
  return window.__photoChoice;
}
function hasBasePhotography(ctx = packageUpgradeState()) {
  return /one photographer|photographer|photography|photo gallery|edited images/.test(ctx.packageText) || ctx.selected.has('photo-one');
}
function basePackageText() {
  return Array.from(document.querySelectorAll('.package-list > li:not([data-upgrade-line])')).map(li => li.textContent || '').join('\n').toLowerCase();
}
function packageHasBasePhotography(ctx = packageUpgradeState()) {
  return /one photographer|photographer|photography|photo gallery|edited images/.test(basePackageText() || ctx.packageText);
}
function packageHasBaseVideo(ctx = packageUpgradeState()) {
  return /one videographer|raw video footage|digital download of high resolution video/.test(basePackageText() || ctx.packageText);
}
function builderState() {
  window.__bookedPackageBuilder ||= {done:true, values:{}, activeDate: originalPackageDate(), calendarOpen:false, calendarMonth:''};
  window.__bookedPackageBuilder.values ||= {};
  window.__bookedPackageBuilder.activeDate ||= originalPackageDate();
  return window.__bookedPackageBuilder;
}
function originalPackageDate() {
  return state.eventInfo?.eventDate || 'Original event date';
}
function activePackageDate() {
  return builderState().activeDate || originalPackageDate();
}
function packageDateLabel(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? formatBoothDate(value) : (value || originalPackageDate());
}
function packageDateAttr(value) {
  return String(value || originalPackageDate()).replace(/"/g, '&quot;');
}
function packageDateSelector(value) {
  return String(value || originalPackageDate()).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
function syncPackageDateHeaders() {
  const list = document.querySelector('.package-list');
  if (!list) return;
  const original = originalPackageDate();
  document.querySelectorAll('.package-list [data-base-package-line]:not([data-shoot-date]), .package-list [data-upgrade-line]:not([data-shoot-date])').forEach(line => { line.dataset.shootDate = original; });
  const packageLines = Array.from(document.querySelectorAll('.package-list .package-base-title, .package-list .package-upgrade-title'));
  const dates = [...new Set(packageLines.map(line => line.dataset.shootDate || original))];
  document.querySelectorAll('.package-list [data-package-date-header]').forEach(header => header.remove());
  if (dates.length <= 1) return;
  dates.forEach(date => {
    const firstLine = packageLines.find(line => (line.dataset.shootDate || original) === date);
    if (!firstLine) return;
    const header = document.createElement('li');
    header.className = 'package-date-header';
    header.classList.toggle('is-active-package-date', date === activePackageDate());
    header.dataset.packageDateHeader = date;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'package-date-switch';
    button.dataset.packageDateSwitch = date;
    button.textContent = packageDateLabel(date);
    button.setAttribute('aria-label', `Edit package for ${packageDateLabel(date)}`);
    header.appendChild(button);
    list.insertBefore(header, firstLine);
  });
}
function renderPackageBuilderDateCalendar(open = true) {
  const state = builderState();
  const source = state.calendarMonth || (/^\d{4}-\d{2}-\d{2}$/.test(state.activeDate) ? state.activeDate : '');
  const current = source ? new Date(`${source}T12:00:00`) : new Date();
  const year = current.getFullYear();
  const month = current.getMonth();
  const first = new Date(year, month, 1);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const label = first.toLocaleDateString(undefined, {month:'long', year:'numeric'});
  const cells = [];
  for (let i = 0; i < first.getDay(); i++) cells.push('<span></span>');
  for (let day = 1; day <= daysInMonth; day++) {
    const value = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const disabled = new Date(year, month, day) < today;
    const classes = [value === state.activeDate ? 'is-selected' : '', disabled ? 'is-disabled' : ''].filter(Boolean).join(' ');
    cells.push(`<button type="button" class="${classes}" data-builder-date-pick="${value}" ${disabled ? 'disabled aria-disabled="true"' : ''}>${day}</button>`);
  }
  return `<div class="package-builder-calendar booth-calendar ${open ? 'is-open' : ''}" data-builder-date-calendar><div class="booth-calendar-head"><button type="button" data-builder-date-month="-1">‹</button><strong>${label}</strong><button type="button" data-builder-date-month="1">›</button></div><div class="booth-calendar-days"><span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span></div><div class="booth-calendar-grid">${cells.join('')}</div></div>`;
}
function syncPackageBuilderCalendar() {
  const holder = document.querySelector('[data-builder-date-calendar-holder]');
  if (!holder) return;
  holder.innerHTML = builderState().calendarOpen ? renderPackageBuilderDateCalendar(true) : '';
}
function basePackageEntries() {
  return Array.from(document.querySelectorAll('.package-list .package-base-title')).map(li => ({key: li.dataset.basePackageLine, date: li.dataset.shootDate || originalPackageDate(), hours: Number(li.dataset.hours || 0), qty: Number(li.dataset.qty || 1)})).filter(entry => entry.key);
}
function basePackageKeys() {
  return basePackageEntries().map(entry => entry.key);
}
function activeBasePackageKeys() {
  const date = activePackageDate();
  return basePackageEntries().filter(entry => entry.date === date).map(entry => entry.key);
}
function builderValue(key) {
  const state = builderState();
  const defaults = {'photo-one':8, 'photo-second':8, 'elopement-photo-one':1, 'video-one':8, 'video-second':8, 'elopement-video-one':1, engagement:1, retouching:10, 'content-creator':8, 'content-package':8, 'elopement-content-creator':1, 'elopement-content-package':1, 'photo-book-10':1, 'photo-book-12':1};
  state.values[key] ??= defaults[key] || 1;
  return Number(state.values[key]);
}
function builderSetValue(key, value) {
  const state = builderState();
  const limits = {
    'photo-one':[6,14], 'photo-second':[4,14], 'elopement-photo-one':[1,4], 'video-one':[4,14], 'video-second':[4,14], 'elopement-video-one':[1,4], engagement:[1,2], retouching:[10,30], 'content-creator':[4,14], 'content-package':[4,14], 'elopement-content-creator':[1,4], 'elopement-content-package':[1,4], 'photo-book-10':[1,9], 'photo-book-12':[1,9]
  };
  const step = key === 'retouching' ? 10 : 1;
  const [min,max] = limits[key] || [1,99];
  const normalized = Math.max(min, Math.min(max, Number(value || min)));
  state.values[key] = key === 'retouching' ? Math.round(normalized / step) * step : normalized;
}
function packageBaseItemMeta(key, entries = basePackageEntries()) {
  return entries.find(entry => entry.key === key) || {key, hours: builderValue(key), qty: builderValue(key)};
}
function packageBaseLinePrice(key) {
  const date = activePackageDate();
  const keys = basePackageEntries().filter(entry => entry.date === date).map(entry => entry.key);
  const def = basePackageDefinitions()[key];
  const value = builderValue(def?.controlKey || key);
  const meta = {key, date, hours: def?.control === 'hours' ? value : 0, qty: def?.control === 'qty' ? value : 1};
  return packageBaseItemPrice(key, keys.includes(key) ? keys : [...keys, key], meta);
}
function packageBaseItemPrice(key, keys = basePackageKeys(), metaOverride = null) {
  const entries = basePackageEntries();
  const hasPhoto = keys.includes('photo-one');
  const hasVideo = keys.includes('video-one');
  const hasElopementPhoto = keys.includes('elopement-photo-one');
  const hasElopementVideo = keys.includes('elopement-video-one');
  const hasSecondVideo = keys.includes('video-second');
  const hasVideoEditing = keys.some(k => ['video-cinematography','video-trailer','video-extended','video-traditional'].includes(k));
  const hasPremiumPhotoPackage = keys.includes('premium-photo-package');
  const hourly = (base, hours, below = 100, above = 150, min = 4) => {
    const h = Math.max(min, Number(hours || 8));
    if (h < 8) return base - ((8 - h) * below);
    if (h > 8) return base + ((h - 8) * above);
    return base;
  };
  const meta = metaOverride || packageBaseItemMeta(key, entries);
  const prices = {
    'photo-one': hourly(2999, meta.hours || 8, 150, 150, 6),
    'photo-second': hourly(999, meta.hours || 8, 100, 150, 4),
    'elopement-photo-one': 599 + ((Math.max(1, Number(meta.hours || 1)) - 1) * 200),
    engagement: hasPhoto ? (Number(meta.hours) === 2 ? 499 : 399) : (Number(meta.hours) === 2 ? 699 : 599),
    'photo-book-10': (519 * (meta.qty || 1)),
    'photo-book-12': (569 * (meta.qty || 1)),
    'photo-book-10-design': (619 * (meta.qty || 1)),
    'photo-book-12-design': (669 * (meta.qty || 1)),
    retouching: ({10:199, 20:299, 30:399})[meta.qty || 10] || 199,
    'expedited-photo': 99,
    'premium-photo-editing': 199,
    'premium-photo-package': 299,
    'video-one': hourly(hasPhoto ? 1999 : 2399, meta.hours || 8, 100, 150, 4),
    'video-second': hourly(999, meta.hours || 8, 100, 150, 4),
    'elopement-video-one': 599 + ((Math.max(1, Number(meta.hours || 1)) - 1) * 200),
    'video-cinematography': hasSecondVideo ? 1099 : 999,
    'video-trailer': hasSecondVideo ? 699 : 599,
    'video-extended': hasSecondVideo ? 799 : 699,
    'video-traditional': hasSecondVideo ? 699 : 599,
    'premium-video-package': hasVideo && hasVideoEditing && (hasPremiumPhotoPackage || keys.includes('video-extended')) ? 199 : 299,
    'sneak-photo': 99,
    'sneak-video': hasVideo && !hasVideoEditing ? 399 : 199,
    'sneak-photo-video': hasVideo && !hasVideoEditing ? 499 : 299,
    'photo-booth-3': hasPhoto && hasVideo ? 699 : (hasPhoto || hasVideo ? 799 : 899),
    'photo-booth-4': hasPhoto && hasVideo ? 799 : (hasPhoto || hasVideo ? 899 : 999),
    'content-creator': contentCreationBasePrice('creator', meta.hours || 8, hasPhoto || hasVideo),
    'content-package': contentCreationBasePrice('package', meta.hours || 8, hasPhoto || hasVideo),
    'elopement-content-creator': elopementContentCreationPrice('creator', meta.hours || 1, hasPhoto || hasVideo || hasElopementPhoto || hasElopementVideo),
    'elopement-content-package': elopementContentCreationPrice('package', meta.hours || 1, hasPhoto || hasVideo || hasElopementPhoto || hasElopementVideo),
    'elopement-officiant': 599,
    'highlight-reel': 150,
    'short-reel': 50
  };
  return prices[key] || 0;
}
function contentCreationBasePrice(type, hours, bundled = false) {
  const h = Math.max(4, Number(hours || 8));
  const tables = bundled
    ? {
        package: {4:1199, 5:1249, 6:1299, 7:1399, 8:1499},
        creator: {4:999, 5:1049, 6:1099, 7:1199, 8:1299}
      }
    : {
        package: {4:1399, 5:1449, 6:1499, 7:1599, 8:1699},
        creator: {4:1199, 5:1249, 6:1299, 7:1399, 8:1499}
      };
  const table = tables[type === 'package' ? 'package' : 'creator'];
  if (h <= 8) return table[h] || table[8];
  return table[8] + ((h - 8) * 150);
}
function elopementContentCreationPrice(type, hours, bundled = false) {
  const h = Math.max(1, Number(hours || 1));
  const base = type === 'package' ? (bundled ? 499 : 599) : (bundled ? 399 : 499);
  return base + ((h - 1) * 200);
}
function packageUndiscountedBaseItemPrice(key, keys = basePackageKeys(), metaOverride = null) {
  const entries = basePackageEntries();
  const meta = metaOverride || packageBaseItemMeta(key, entries);
  const hourly = (base, hours, below = 100, above = 150, min = 4) => {
    const h = Math.max(min, Number(hours || 8));
    if (h < 8) return base - ((8 - h) * below);
    if (h > 8) return base + ((h - 8) * above);
    return base;
  };
  const prices = {
    engagement: Number(meta.hours) === 2 ? 699 : 599,
    'video-one': hourly(2399, meta.hours || 8, 100, 150, 4),
    'photo-booth-3': 899,
    'photo-booth-4': 999,
    'elopement-content-creator': elopementContentCreationPrice('creator', meta.hours || 1, false),
    'elopement-content-package': elopementContentCreationPrice('package', meta.hours || 1, false)
  };
  return prices[key] ?? packageBaseItemPrice(key, keys);
}
function packageBundledSavings() {
  const entries = basePackageEntries();
  const keys = entries.map(entry => entry.key);
  let savings = entries.reduce((sum, entry) => {
    const keysForDate = entries.filter(other => other.date === entry.date).map(other => other.key);
    return sum + Math.max(0, packageUndiscountedBaseItemPrice(entry.key, keysForDate, entry) - packageBaseItemPrice(entry.key, keysForDate, entry));
  }, 0);
  const defs = upgradeDefinitions();
  if (keys.includes('premium-photo-package') && keys.includes('premium-video-package')) savings += 100;
  document.querySelectorAll('.package-list [data-upgrade-line]').forEach(line => {
    const key = line.dataset.upgradeLine;
    const qty = Number(line.dataset.quantity || 1);
    const current = packageUpgradeLinePrice(line, defs);
    const undiscounted = ({
      engagement: Number(line.dataset.hours) === 2 ? 699 : 599,
      'video-one': (() => { const h = Math.max(4, Number(line.dataset.hours || 8)); if (h < 8) return 2399 - ((8 - h) * 100); return 2399 + ((h - 8) * 150); })(),
      'photo-booth-3': 899,
      'photo-booth-4': 999,
      'premium-video': /premium photo/i.test(basePackageText()) ? 299 : undefined
    })[key];
    if (undiscounted !== undefined) savings += Math.max(0, (undiscounted * qty) - current);
  });
  return savings;
}
function packageBasePrice(ctx = packageUpgradeState()) {
  const entries = basePackageEntries();
  const keys = entries.map(entry => entry.key);
  if (entries.length) return entries.reduce((sum, entry) => {
    const keysForDate = entries.filter(other => other.date === entry.date).map(other => other.key);
    return sum + packageBaseItemPrice(entry.key, keysForDate, entry);
  }, 0);
  let total = 0;
  const text = basePackageText() || ctx.packageText;
  const hasPhoto = packageHasBasePhotography(ctx);
  const hasVideo = packageHasBaseVideo(ctx);
  if (hasPhoto) total += 2999;
  if (/second photographer/.test(text)) total += 999;
  if (hasVideo) total += hasPhoto ? 1999 : 2399;
  if (/second videographer/.test(text)) total += 999;
  if (/photo book 10x10|10x10/.test(text)) total += 519;
  else if (/photo book 12x12|12x12/.test(text)) total += 569;
  if (/photo booth, 3 hours|photo booth basic|photo booth 3/i.test(text)) total += hasPhoto && hasVideo ? 699 : (hasPhoto || hasVideo ? 799 : 899);
  else if (/photo booth, 4 hours|all inclusive|photo booth 4/i.test(text)) total += hasPhoto && hasVideo ? 799 : (hasPhoto || hasVideo ? 899 : 999);
  if (/content creation package/i.test(text)) total += hasPhoto || hasVideo ? 1499 : 1699;
  else if (/content creator/i.test(text)) total += hasPhoto || hasVideo ? 1299 : 1499;
  return total;
}
function packageUpgradeLinePrice(li, defs = upgradeDefinitions()) {
  const key = li?.dataset?.upgradeLine || '';
  const qty = Number(li?.dataset?.quantity || 1);
  const hours = Number(li?.dataset?.hours || 0);
  if (hours) {
    if (key === 'photo-one') return photoCoveragePrice('one', hours) * qty;
    if (key === 'photo-second') return photoCoveragePrice('second', hours) * qty;
    if (key === 'video-one') return videoCoveragePrice('one', hours) * qty;
    if (key === 'video-second') return videoCoveragePrice('second', hours) * qty;
    if (key === 'content-creator') return contentCreationPrice('creator', hours) * qty;
    if (key === 'content-creation-package') return contentCreationPrice('package', hours) * qty;
  }
  return ((defs[key]?.price || 0) * qty);
}
function packageBaseItemPriceAt(line, key, attrs = {}) {
  if (!line) return 0;
  const oldHours = line.dataset.hours;
  const oldQty = line.dataset.qty;
  if (attrs.hours !== undefined) line.dataset.hours = String(attrs.hours);
  if (attrs.qty !== undefined) line.dataset.qty = String(attrs.qty);
  const price = packageBaseItemPrice(key);
  if (oldHours === undefined) delete line.dataset.hours; else line.dataset.hours = oldHours;
  if (oldQty === undefined) delete line.dataset.qty; else line.dataset.qty = oldQty;
  return price;
}
function packageUpgradeLinePriceAt(line, attrs = {}) {
  if (!line) return 0;
  const oldHours = line.dataset.hours;
  const oldQty = line.dataset.quantity;
  if (attrs.hours !== undefined) line.dataset.hours = String(attrs.hours);
  if (attrs.quantity !== undefined) line.dataset.quantity = String(attrs.quantity);
  const price = packageUpgradeLinePrice(line);
  if (oldHours === undefined) delete line.dataset.hours; else line.dataset.hours = oldHours;
  if (oldQty === undefined) delete line.dataset.quantity; else line.dataset.quantity = oldQty;
  return price;
}
function packageClientUpgradeRows() {
  if (state.isAdmin) return [];
  const rows = [];
  document.querySelectorAll('.package-list .package-base-title').forEach(line => {
    const key = line.dataset.basePackageLine;
    const name = line.querySelector('.package-upgrade-name')?.textContent.trim() || 'Package upgrade';
    const hours = Number(line.dataset.hours || 0);
    const minHours = Number(line.dataset.minHours || 0);
    if (hours && minHours && hours > minHours) {
      const delta = packageBaseItemPriceAt(line, key, {hours}) - packageBaseItemPriceAt(line, key, {hours: minHours});
      if (delta > 0) rows.push({label: `${name}: +${hours - minHours} hr`, amount: delta});
    }
    const qty = Number(line.dataset.qty || 0);
    const minQty = Number(line.dataset.minQty || 0);
    if (qty && minQty && qty > minQty) {
      const delta = packageBaseItemPriceAt(line, key, {qty}) - packageBaseItemPriceAt(line, key, {qty: minQty});
      if (delta > 0) rows.push({label: `${name}: +${qty - minQty}`, amount: delta});
    }
  });
  document.querySelectorAll('.package-list .package-upgrade-title').forEach(line => {
    const name = line.querySelector('.package-upgrade-name')?.textContent.trim() || 'Package upgrade';
    if (line.dataset.clientUpgrade === '1') {
      rows.push({label: name, amount: packageUpgradeLinePrice(line)});
      return;
    }
    const hours = Number(line.dataset.hours || 0);
    const minHours = Number(line.dataset.minHours || 0);
    if (hours && minHours && hours > minHours) {
      const delta = packageUpgradeLinePriceAt(line, {hours}) - packageUpgradeLinePriceAt(line, {hours: minHours});
      if (delta > 0) rows.push({label: `${name}: +${hours - minHours} hr`, amount: delta});
    }
    const qty = Number(line.dataset.quantity || 0);
    const minQty = Number(line.dataset.minQuantity || 0);
    if (qty && minQty && qty > minQty) {
      const delta = packageUpgradeLinePriceAt(line, {quantity: qty}) - packageUpgradeLinePriceAt(line, {quantity: minQty});
      if (delta > 0) rows.push({label: `${name}: +${qty - minQty}`, amount: delta});
    }
  });
  return rows;
}
function packageUpgradeTotal(defs = upgradeDefinitions()) {
  return Array.from(document.querySelectorAll('.package-list .package-upgrade-title')).reduce((sum, li) => sum + packageUpgradeLinePrice(li, defs), 0);
}
function packageTaxableBaseTotal(ctx = packageUpgradeState()) {
  const keys = basePackageKeys();
  if (keys.length) return keys.filter(key => ['photo-book-10','photo-book-12','photo-book-10-design','photo-book-12-design','photo-booth-3','photo-booth-4'].includes(key)).reduce((sum, key) => sum + packageBaseItemPrice(key, keys), 0);
  if (document.querySelector('.package-list [data-base-package-line], .package-list [data-upgrade-line]')) return 0;
  const text = basePackageText() || ctx.packageText;
  let total = 0;
  const hasPhoto = packageHasBasePhotography(ctx);
  const hasVideo = packageHasBaseVideo(ctx);
  if (/photo book 10x10|10x10/.test(text)) total += 519;
  else if (/photo book 12x12|12x12/.test(text)) total += 569;
  if (/photo booth, 3 hours|photo booth basic|photo booth 3/i.test(text)) total += hasPhoto && hasVideo ? 699 : (hasPhoto || hasVideo ? 799 : 899);
  else if (/photo booth, 4 hours|all inclusive|photo booth 4/i.test(text)) total += hasPhoto && hasVideo ? 799 : (hasPhoto || hasVideo ? 899 : 999);
  return total;
}
function packageTaxableUpgradeTotal(defs = upgradeDefinitions()) {
  return Array.from(document.querySelectorAll('.package-list .package-upgrade-title')).reduce((sum, li) => {
    const key = li.dataset.upgradeLine || '';
    if (!key.startsWith('photo-book') && !key.startsWith('photo-booth')) return sum;
    const qty = Number(li.dataset.quantity || 1);
    return sum + packageUpgradeLinePrice(li, defs);
  }, 0);
}
function packagePaymentRows() {
  return [
    {date: 'Sep 16, 2016', method: 'zelle', amount: 1000},
    {date: 'Dec 22, 2016', method: 'check', amount: 500},
    {date: 'Dec 23, 2016', method: 'credit card', amount: 500}
  ];
}
function paymentAdjustmentState() {
  window.__paymentAdjustments ||= [];
  return window.__paymentAdjustments;
}
function syncPaymentAdjustmentLayout() {
  requestAnimationFrame(() => syncHomeGridHeight());
}
function addPaymentAdjustment(type) {
  const labels = {discount:'Discount', gratuity:'Gratuity', other:'Other'};
  paymentAdjustmentState().push({id: Date.now() + Math.random(), type, label: labels[type] || 'Other', amount: 0, raw: '', renaming: false});
  updatePackageBalance();
  closePaymentPlusPopup();
  syncPaymentAdjustmentLayout();
}
function paymentAdjustmentTotal() {
  return paymentAdjustmentState().reduce((sum, row) => sum + Number(row.amount || 0), 0);
}
function renamePaymentAdjustment(id) {
  const row = paymentAdjustmentState().find(item => String(item.id) === String(id));
  if (!row) return;
  row.renaming = true;
  updatePackageBalance();
  setTimeout(() => document.querySelector(`[data-payment-adjustment-label="${id}"]`)?.focus(), 0);
}
function savePaymentAdjustmentLabel(id, label) {
  const row = paymentAdjustmentState().find(item => String(item.id) === String(id));
  if (!row) return;
  const next = String(label || '').trim();
  if (next) row.label = next;
  row.renaming = false;
  updatePackageBalance();
}
function finishPaymentAdjustmentEdit(id) {
  const row = paymentAdjustmentState().find(item => String(item.id) === String(id));
  if (!row) return;
  const label = document.querySelector(`[data-payment-adjustment-label="${id}"]`);
  if (label) {
    const next = String(label.value || '').trim();
    if (next) row.label = next;
  }
  const amount = document.querySelector(`[data-payment-adjustment-amount="${id}"]`);
  if (amount) {
    const raw = String(amount.value || '').replace(/[^0-9.-]/g, '').replace(/(?!^)-/g, '');
    row.amount = raw === '' || raw === '-' ? 0 : Number(raw || 0);
    row.raw = raw === '' || raw === '-' ? raw : row.amount.toFixed(2);
  }
  row.renaming = false;
  updatePackageBalance();
}
function updatePaymentAdjustment(id, amount) {
  const row = paymentAdjustmentState().find(item => String(item.id) === String(id));
  if (!row) return;
  const raw = String(amount || '').replace(/[^0-9.-]/g, '').replace(/(?!^)-/g, '');
  row.amount = raw === '' || raw === '-' ? 0 : Number(raw || 0);
  row.raw = raw === '' || raw === '-' ? raw : row.amount.toFixed(2);
  updatePackageBalance();
  syncPaymentAdjustmentLayout();
}
function removePaymentAdjustment(id) {
  const rows = paymentAdjustmentState();
  const index = rows.findIndex(item => String(item.id) === String(id));
  if (index >= 0) rows.splice(index, 1);
  updatePackageBalance();
  syncPaymentAdjustmentLayout();
}
function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}
function packageCurrentPrice() {
  const defs = upgradeDefinitions();
  return packageBasePrice() + packageUpgradeTotal(defs);
}
function packageSalesTax() {
  const taxable = packageTaxableBaseTotal() + packageTaxableUpgradeTotal();
  return taxable * 0.08875;
}
function packageGrandTotal() {
  return packageCurrentPrice() + packageSalesTax() + paymentAdjustmentTotal();
}
function packagePaymentsTotal() {
  return packagePaymentRows().reduce((sum, row) => sum + row.amount, 0);
}
function packageBalanceDue() {
  return packageGrandTotal() - packagePaymentsTotal();
}
function photoCoveragePrice(type, hours, ctx = packageUpgradeState()) {
  const h = Math.max(6, Number(hours || 8));
  const hasVideo = ctx.hasVideography || /videographer|raw video footage/.test(ctx.packageText);
  const base = type === 'second' ? 999 : 2999;
  if (h >= 8) return base + ((h - 8) * 150);
  return base - ((8 - h) * (type === 'second' ? 100 : 150));
}
function photoAverageImages(type, hours) {
  const h = Math.max(6, Number(hours || 8));
  if (type === 'second') return 400 + ((h - 8) * 50);
  return 700 + (h > 8 ? ((h - 8) * 50) : ((h - 8) * 100));
}
function photoChoiceForUpgrade(upgrade) {
  const state = photoChoiceState();
  const type = upgrade === 'photo-second' ? 'second' : 'one';
  const hours = state.hours?.[type] || 8;
  return {type, hours, price: photoCoveragePrice(type, hours)};
}
function packageUpgradeState() {
  const packageText = document.querySelector('.package-list')?.innerText.toLowerCase() || '';
  const selected = new Set(Array.from(document.querySelectorAll('.package-list [data-upgrade-line]')).map(li => li.dataset.upgradeLine));
  const baseKeys = basePackageKeys();
  const hasVideoBase = baseKeys.some(key => key.startsWith('video-')) || /videographer|raw video footage|digital download of high resolution video|traditional video edit|cinematography video editing/.test(packageText);
  const hasVideography = hasVideoBase || selected.has('premium-video') || selected.has('video-one') || selected.has('video-second') || selected.has('video-editing');
  const hasPhotoBooth = packageText.includes('photo booth') || selected.has('photo-booth-3') || selected.has('photo-booth-4');
  const hasPhotoBook = packageText.includes('photo book') || packageText.includes('album') || selected.has('photo-book-10') || selected.has('photo-book-12') || selected.has('photo-book-10-pro') || selected.has('photo-book-12-pro');
  const hasContentCreation = baseKeys.some(key => key.startsWith('content-') || key === 'highlight-reel' || key === 'short-reel') || packageText.includes('content creation') || packageText.includes('content creator') || selected.has('content-creator') || selected.has('content-creation-package') || selected.has('content-creation');
  const hasPhotoUpgrade = selected.has('sneak-peek') || selected.has('premium-photo') || packageText.includes('sneak peek') || packageText.includes('premium photo');
  const hasPhotography = packageText.includes('photographer') || packageText.includes('photography') || packageText.includes('photo gallery') || selected.has('photo-one') || selected.has('photo-second');
  const isPhotoOnly = hasPhotography && !hasVideography && !hasPhotoBook;
  return {packageText, selected, hasVideoBase, hasVideography, hasPhotoBooth, hasPhotoBook, hasContentCreation, hasPhotoUpgrade, hasPhotography, isPhotoOnly};
}
function photoBoothPrice(hours, ctx = packageUpgradeState()) {
  const hasPhoto = /photographer|photography|photo gallery|edited images/.test(ctx.packageText);
  const hasVideo = ctx.hasVideography;
  const hasPhotoAndVideo = hasPhoto && hasVideo;
  if (Number(hours) === 3) return hasPhotoAndVideo ? 699 : (hasPhoto || hasVideo ? 799 : 899);
  return hasPhotoAndVideo ? 799 : (hasPhoto || hasVideo ? 899 : 999);
}
function contentCreationChoiceState() {
  window.__contentCreationChoice ||= {date: '', status: 'idle', selected: '', hours: {creator: 8, package: 8}, calendarMonth: '', calendarOpen: false};
  window.__contentCreationChoice.hours ||= {creator: 8, package: 8};
  return window.__contentCreationChoice;
}
function contentCreationPrice(type, hours) {
  const h = Math.max(4, Number(hours || 8));
  const bundled = hasPhotographyPackage() || packageUpgradeState().hasVideography;
  return contentCreationBasePrice(type === 'package' ? 'package' : 'creator', h, bundled);
}
function contentChoiceForUpgrade(upgrade) {
  const state = contentCreationChoiceState();
  const isPackage = upgrade === 'content-creation-package';
  const hours = state.hours?.[isPackage ? 'package' : 'creator'] || 8;
  return {hours, price: contentCreationPrice(isPackage ? 'package' : 'creator', hours)};
}
function hasPhotographyPackage(ctx = packageUpgradeState()) {
  return packageHasBasePhotography(ctx) || ctx.selected?.has?.('photo-one') || ctx.selected?.has?.('photo-second');
}
function videoChoiceState() {
  window.__videoChoice ||= {date: '', status: 'idle', selected: '', secondSelected: false, hours: {one: 8, second: 8}, edits: [], calendarMonth: '', calendarOpen: false};
  window.__videoChoice.hours ||= {one: 8, second: 8};
  window.__videoChoice.edits ||= [];
  return window.__videoChoice;
}
function videoCoveragePrice(type, hours, ctx = packageUpgradeState()) {
  const h = Math.max(6, Number(hours || 8));
  const withPhoto = hasPhotographyPackage(ctx);
  const table = type === 'second'
    ? {6:799, 7:899, 8:999}
    : withPhoto ? {6:1799, 7:1899, 8:1999} : {6:2199, 7:2299, 8:2399};
  if (h <= 8) return table[h] || table[8];
  return table[8] + ((h - 8) * 150);
}
function videoEditPrice(key, twoVideographers = false) {
  const prices = twoVideographers
    ? {cinematography:1099, trailer:699, traditional:699, extended:799}
    : {cinematography:999, trailer:599, traditional:599, extended:699};
  return prices[key] || 0;
}
function videoEditLabel(key) {
  return ({cinematography:'Cinematography', trailer:'Trailer', traditional:'Traditional', extended:'Extended trailer'})[key] || key;
}
function videoEditItems(edits = []) {
  if (!edits.length) return [];
  const items = ['Video editing options'];
  if (edits.includes('cinematography')) items.push('Cinematography style (30-45 min.)', 'Trailer (3-5min.)');
  if (edits.includes('trailer')) items.push('Trailer (3-5min.)');
  if (edits.includes('traditional')) items.push('Traditional (45-60min.)');
  if (edits.includes('extended')) items.push('Extended trailer (6-10min.)');
  return items;
}
function videoEditingStateFromPackage(ctx = packageUpgradeState()) {
  const text = ctx.packageText;
  const hasCinematography = text.includes('cinematography style') || text.includes('cinematography');
  const hasTraditional = text.includes('traditional');
  const hasExtended = text.includes('extended trailer');
  const hasTrailer = (text.includes('trailer') || text.includes('3-5min')) && !hasExtended;
  return {hasCinematography, hasTrailer, hasTraditional, hasExtended, hasAny: hasCinematography || hasTrailer || hasTraditional || hasExtended};
}
function premiumVideoUpgrade(ctx = packageUpgradeState()) {
  const edit = videoEditingStateFromPackage(ctx);
  if (!ctx.hasVideography || !edit.hasAny) return null;
  const baseItems = ['1 min. Video Reel', 'Expedited Processing Upgrade', '5 Year Online Viewing, Storage, Download Upgrade', 'Premium Song Upgrade'];
  const needsBoth = (edit.hasTraditional && edit.hasTrailer) || (edit.hasTraditional && edit.hasExtended);
  if (needsBoth) return {price: edit.hasExtended ? 199 : 299, items: ['Extended Trailer / Cinematography Sound Upgrade', ...baseItems]};
  if (/premium photo/i.test(ctx.packageText)) return {price: 199, items: edit.hasExtended ? baseItems : ['Extended Trailer', ...baseItems]};
  if (edit.hasTraditional) return {price: 299, items: ['Cinematography Sound Upgrade', ...baseItems]};
  if (edit.hasExtended) return {price: 199, items: baseItems};
  if (edit.hasCinematography || edit.hasTrailer) return {price: 299, items: ['Extended Trailer', ...baseItems]};
  return null;
}
function packageHasRawVideoWithoutEditing(ctx = packageUpgradeState()) {
  return ctx.hasVideography && !videoEditingStateFromPackage(ctx).hasAny && !ctx.selected.has('video-editing');
}
function syncEditVideoAction() {
  const ctx = packageUpgradeState();
  document.querySelectorAll('[data-edit-video-action]').forEach(el => el.remove());
  if (!packageHasRawVideoWithoutEditing(ctx)) return;
  const oneVideo = Array.from(document.querySelectorAll('.package-list li')).find(li => /one videographer/i.test(li.textContent || ''));
  if (!oneVideo) return;
  return;
}
function videoChoiceForUpgrade(upgrade) {
  const state = videoChoiceState();
  const type = upgrade === 'video-second' ? 'second' : 'one';
  const hours = state.hours?.[type] || 8;
  const edits = type === 'second' ? [] : [...(state.edits || [])];
  const coverage = videoCoveragePrice(type, hours);
  return {type, hours, edits, price: coverage};
}
function upgradeDefinitions(ctx = packageUpgradeState()) {
  return {
    'photo-one': (() => { const choice = photoChoiceForUpgrade('photo-one'); return {
      title: `One Photographer, ${choice.hours} hours`, price: choice.price, availability: true, inlineNotice: true, email: true,
      notice: 'Photography has been added to your package. We still need our studio team to manually confirm staffing and event date availability. If anything needs to be adjusted, we will contact you right away.',
      items: [`${choice.hours} hours`, `Average of ${photoAverageImages('one', choice.hours)} edited images`, 'Online photo gallery store', 'Highlight Photography Page', 'Digital download of high resolution images', 'Full printing rights (no watermarks)', 'Free Guest upload link & QR Code']
    }; })(),
    'photo-second': (() => { const choice = photoChoiceForUpgrade('photo-second'); return {
      title: `Second Photographer, ${choice.hours} hours`, price: choice.price, availability: true, inlineNotice: true, email: true,
      notice: 'Second photographer has been added to your package. We still need our studio team to manually confirm staffing and event date availability. If anything needs to be adjusted, we will contact you right away.',
      items: [`${choice.hours} hours`, `Average of ${photoAverageImages('second', choice.hours)} edited images`, 'Online photo gallery store', 'Highlight Photography Page', 'Digital download of high resolution images', 'Full printing rights (no watermarks)', 'Free Guest upload link & QR Code']
    }; })(),
    'sneak-peek': {
      title: 'Sneak Peek Package', price: 99,
      items: ['50 Edited Sneak Peek Photos', 'Wedding Photo Reel', '7 Business Day Turnaround']
    },
    'premium-photo': {
      title: 'Premium Photography Package', price: 299,
      items: ['Premium Photo Editing Upgrade', 'Expedited Processing Upgrade', 'Sneak Peek Package, 50 photos within 7 days', '5 Year Online Viewing, Storage, Download Upgrade']
    },
    'video-one': (() => { const choice = videoChoiceForUpgrade('video-one'); return {
      title: `One Videographer, ${choice.hours} hours`, price: choice.price, availability: true, inlineNotice: true, email: true,
      notice: 'Videography has been added to your package. We still need our studio team to manually confirm staffing and event date availability. If anything needs to be adjusted, we will contact you right away.',
      items: [`${choice.hours} hours`, 'Raw video footage', 'Digital download of high resolution video']
    }; })(),
    'video-second': (() => { const choice = videoChoiceForUpgrade('video-second'); return {
      title: `Second Videographer, ${choice.hours} hours`, price: choice.price, availability: true, inlineNotice: true, email: true,
      notice: 'Second videographer has been added to your package. We still need our studio team to manually confirm staffing and event date availability. If anything needs to be adjusted, we will contact you right away.',
      items: [`${choice.hours} hours`, 'Raw video footage', 'Digital download of high resolution video']
    }; })(),
    'video-editing': (() => { const state = videoChoiceState(); const edits = [...(state.edits || [])]; return {
      title: 'Video Editing Options', price: edits.reduce((sum, key) => sum + videoEditPrice(key, !!state.secondSelected), 0), email: true,
      notice: 'Video editing options have been added to your package request.',
      items: videoEditItems(edits).slice(1)
    }; })(),
    'premium-video': (() => { const premium = premiumVideoUpgrade(ctx) || {price:299, items:['Cinematography Sound Upgrade', '1 min. Video Reel', 'Expedited Processing Upgrade', '5 Year Online Viewing, Storage, Download Upgrade', 'Premium Song Upgrade']}; return {
      title: 'Premium Video', price: premium.price, email: true,
      items: premium.items
    }; })(),
    'photo-booth-3': {
      title: 'Photo Booth, 3 Hours', price: photoBoothPrice(3, ctx), availability: true, inlineNotice: true,
      notice: 'Photo Booth has been added to your package. We still need our studio team to manually confirm staffing and event date availability. If anything needs to be adjusted, we will contact you right away.',
      items: ['3-Hour Rental', 'Set up & Break down', 'Photo Booth Attendant for the duration of your rental', 'Unlimited Printing (4x6 or 2x6 prints)', 'Backdrop and Props', 'Parking must be provided']
    },
    'photo-booth-4': {
      title: 'Photo Booth, 4 Hours', price: photoBoothPrice(4, ctx), availability: true, inlineNotice: true,
      notice: 'Photo Booth has been added to your package. We still need our studio team to manually confirm staffing and event date availability. If anything needs to be adjusted, we will contact you right away.',
      items: ['4-Hour Rental', 'Set up & Break down', 'Photo Booth Attendant for the duration of your rental', 'Unlimited Printing of (4x6 or 2x6 prints)', 'Backdrop and Props', 'Online Photo Gallery of all images', 'Parking must be provided']
    },
    'photo-book-10': {
      title: 'Photo Book 10x10, 30 Pages', price: 519, album: true,
      items: ['DIY Album Design FREE', 'Shipping fee included ($20)']
    },
    'photo-book-10-pro': {
      title: 'Photo Book 10x10, 30 Pages, Professional Album Design', price: 619, album: true,
      items: ['Professional Album Design', 'Shipping fee included ($20)']
    },
    'photo-book-12': {
      title: 'Photo Book 12x12, 30 Pages', price: 569, album: true,
      items: ['DIY Album Design FREE', 'Shipping fee included ($20)']
    },
    'photo-book-12-pro': {
      title: 'Photo Book 12x12, 30 Pages, Professional Album Design', price: 669, album: true,
      items: ['Professional Album Design', 'Shipping fee included ($20)']
    },
    'content-creator': (() => { const choice = contentChoiceForUpgrade('content-creator'); return {
      title: `Content Creator, ${choice.hours} hours`, price: choice.price, availability: true, inlineNotice: true, email: true,
      notice: 'Content Creation has been added to your package. We still need our studio team to manually confirm staffing and event date availability. If anything needs to be adjusted, we will contact you right away.',
      items: [`${choice.hours} hours`, 'Videos shot on iPhone', 'All raw videos', 'Raw content available the same day', 'Digital download']
    }; })(),
    'content-creation-package': (() => { const choice = contentChoiceForUpgrade('content-creation-package'); return {
      title: `Content Creation Package, ${choice.hours} hours`, price: choice.price, availability: true, inlineNotice: true, email: true,
      notice: 'Content Creation has been added to your package. We still need our studio team to manually confirm staffing and event date availability. If anything needs to be adjusted, we will contact you right away.',
      items: [`${choice.hours} hours`, 'Wedding Content Creator', 'Videos shot on iPhone', '1 min. highlight reel recapping your big day', '2 additional short reels (10-30 sec.)', 'All raw videos', 'Raw content available the same day', 'Digital download']
    }; })(),
    'content-creation': {
      title: 'Content Creation Availability Request', price: 0, availability: true, email: true,
      notice: 'Thanks. We need to check Content Creation availability for your event date. Our studio will get back to you soon.',
      items: ['Content Creation availability request sent to the studio', 'We will get back to you soon after checking availability']
    }
  };
}
function basePackageDefinitions(ctx = packageUpgradeState()) {
  const val = builderState().values;
  return {
    'photo-one': {group:'Photography', control:'hours', controlKey:'photo-one', title:'One Photographer', items:['Average of 700 edited images', 'Online photo gallery store', 'Highlight Photography Page', 'Digital download of high resolution images', 'Full printing rights (no watermarks)', 'Free Guest upload link & QR Code']},
    'photo-second': {group:'Photography', control:'hours', controlKey:'photo-second', title:'Second Photographer', items:['Average of 400 edited images', 'Online photo gallery store', 'Highlight Photography Page', 'Digital download of high resolution images', 'Full printing rights (no watermarks)', 'Free Guest upload link & QR Code']},
    'elopement-photo-one': {group:'Elopement', control:'hours', controlKey:'elopement-photo-one', title:'Photographer', items:['Edited images', 'Online photo gallery store', 'Highlight Photography Page', 'Digital download of high resolution images', 'Full printing rights (no watermarks)']}, 
    engagement: {group:'Photography', control:'hours', controlKey:'engagement', title:'Engagement Photoshoot', items:[`${val.engagement === 2 ? '2hrs' : '1hr'} engagement photoshoot`, 'Online gallery']},
    'photo-book-10': {group:'Photography', control:'qty', controlKey:'photo-book-10', title:'Photo Book 10x10, 30 Pages', items:['DIY Album Design FREE', 'Shipping fee included ($20)']},
    'photo-book-12': {group:'Photography', control:'qty', controlKey:'photo-book-12', title:'Photo Book 12x12, 30 Pages', items:['DIY Album Design FREE', 'Shipping fee included ($20)']},
    'photo-book-10-design': {group:'Photography', parent:'photo-book-10', title:'Photo Book 10x10, 30 Pages, Professional Album Design', items:['Professional Album Design', 'Shipping fee included ($20)']},
    'photo-book-12-design': {group:'Photography', parent:'photo-book-12', title:'Photo Book 12x12, 30 Pages, Professional Album Design', items:['Professional Album Design', 'Shipping fee included ($20)']},
    retouching: {group:'Photography', control:'qty', controlKey:'retouching', title:'Photo Retouching', items:['Detailed retouching for selected photos']},
    'expedited-photo': {group:'Photography', title:'Expedited Processing', items:['Faster photo processing and delivery']},
    'premium-photo-editing': {group:'Photography', title:'Premium Photo Editing Upgrade', items:['Premium photo editing upgrade']}, 
    'premium-photo-package': {group:'Photography', title:'Premium Photo Package', items:['Premium Photo Editing Upgrade', 'Expedited Processing Upgrade', 'Sneak Peek Package, 50 photos within 7 days', '5 Year Online Viewing, Storage, Download Upgrade']},
    'video-one': {group:'Videography', control:'hours', controlKey:'video-one', title:'One Videographer', items:['Raw video footage', 'Digital download of high resolution video']},
    'video-second': {group:'Videography', control:'hours', controlKey:'video-second', title:'Second Videographer', items:['Additional raw video coverage', 'Digital download of high resolution video']},
    'elopement-video-one': {group:'Elopement', control:'hours', controlKey:'elopement-video-one', title:'Videographer', items:['Edited elopement video', 'Digital download of high resolution video']},
    'video-cinematography': {group:'Videography', title:'Cinematography Video Editing', items:['Cinematography style edit, 30 to 45 minutes', 'Trailer, 3 to 5 minutes']},
    'video-trailer': {group:'Videography', title:'Trailer Only', items:['Trailer, 3 to 5 minutes']},
    'video-extended': {group:'Videography', title:'Extended Trailer', items:['Extended trailer, 6 to 10 minutes']},
    'video-traditional': {group:'Videography', title:'Traditional Video Edit', items:['Traditional edit, 45 to 60 minutes']}, 
    'premium-video-package': {group:'Videography', title:'Premium Video Package', items:basePackageKeys().includes('video-extended') ? ['1 min. Video Reel', 'Expedited Processing Upgrade', '5 Year Online Viewing, Storage, Download Upgrade', 'Premium Song Upgrade'] : ['Extended Trailer', '1 min. Video Reel', 'Expedited Processing Upgrade', '5 Year Online Viewing, Storage, Download Upgrade', 'Premium Song Upgrade']},
    'sneak-photo': {group:'Sneak Peek', title:'Sneak Peek Package, Photo', items:['50 edited sneak peek photos within 7 days']},
    'sneak-video': {group:'Sneak Peek', title:'Sneak Peek Wedding Video Reel', items:['2 Sneak Peek Video Reels (1min each)', '7 Business Day Turnaround']},
    'sneak-photo-video': {group:'Sneak Peek', title:'Sneak Peek Photo & Video', items:['50 edited sneak peek photos', 'Wedding Photo Reel', '2 Sneak Peek Video Reels (1min each)', '7 Business Day Turnaround']},
    'photo-booth-3': {group:'Photo Booth', title:'Photo Booth Basic Package', items:['3-Hour Rental', 'Set up & Break down', 'Photo Booth Attendant for the duration of your rental', 'Unlimited Printing (4x6 or 2x6 prints)', 'Backdrop and Props', 'Parking must be provided']},
    'photo-booth-4': {group:'Photo Booth', title:'Photo Booth All Inclusive Package', items:['4-Hour Rental', 'Set up & Break down', 'Photo Booth Attendant for the duration of your rental', 'Unlimited Printing of (4x6 or 2x6 prints)', 'Backdrop and Props', 'Online Photo Gallery of all images', 'Parking must be provided']},
    'content-creator': {group:'Content Creation', control:'hours', controlKey:'content-creator', title:'Content Creator', items:['Videos shot on IPhone', 'All raw videos', 'Raw content available the same day', 'Digital download']},
    'content-package': {group:'Content Creation', control:'hours', controlKey:'content-package', title:'Content Creation Package', items:['Wedding Content Creator', 'Videos shot on IPhone', '1 min. highlight reel recapping your big day', '2 additional short reels (10-30 sec.)', 'All raw videos', 'Raw content available the same day', 'Digital download']},
    'elopement-content-creator': {group:'Elopement', control:'hours', controlKey:'elopement-content-creator', title:'Content Creator', items:['Videos shot on IPhone', 'All raw videos', 'Raw content available the same day', 'Digital download']},
    'elopement-content-package': {group:'Elopement', control:'hours', controlKey:'elopement-content-package', title:'Content Creation Package', items:['Wedding Content Creator', 'Videos shot on IPhone', '1 min. highlight reel recapping your big day', 'All raw videos', 'Raw content available the same day', 'Digital download']},
    'elopement-officiant': {group:'Elopement', title:'Officiant', items:['Legally registered Officiant', 'Civil or Spiritual ceremony included', 'Legal filing of marriage license']}, 
    'highlight-reel': {group:'Content Creation', title:'Highlight Reel', items:['Additional 1 minute highlight reel']},
    'short-reel': {group:'Content Creation', title:'Short Reel', items:['Additional short reel']}
  };
}
function refreshBasePackagePrices() {
  const entries = basePackageEntries();
  document.querySelectorAll('.package-list .package-base-title').forEach(titleLine => {
    const key = titleLine.dataset.basePackageLine;
    const date = titleLine.dataset.shootDate || originalPackageDate();
    const keysForDate = entries.filter(entry => entry.date === date).map(entry => entry.key);
    const meta = {key, date, hours: Number(titleLine.dataset.hours || 0), qty: Number(titleLine.dataset.qty || 1)};
    titleLine.querySelector('.package-line-price')?.replaceChildren(document.createTextNode(formatMoney(packageBaseItemPrice(key, keysForDate, meta))));
  });
}
function addBasePackageItem(key) {
  const list = document.querySelector('.package-list');
  if (key === 'premium-photo-package') {
    removeBasePackageItem('sneak-photo');
    removeBasePackageItem('sneak-photo-video');
    removeBasePackageItem('premium-photo-editing');
  }
  if (['sneak-photo','sneak-photo-video','premium-photo-editing'].includes(key) && document.querySelector('.package-list [data-base-package-line="premium-photo-package"]')) return;
  const def = basePackageDefinitions()[key];
  const shootDate = activePackageDate();
  if (!list || !def || document.querySelector(`.package-list [data-base-package-line="${key}"][data-shoot-date="${packageDateSelector(shootDate)}"]`)) return;
  const value = builderValue(def.controlKey || key);
  const attrs = `${def.control === 'hours' ? ` data-hours="${value}" data-min-hours="${value}"` : ''}${def.control === 'qty' ? ` data-qty="${value}" data-min-qty="${value}"` : ''}`;
  const title = `<li class="package-base-title" data-shoot-date="${packageDateAttr(shootDate)}" data-base-package-line="${key}"${attrs}><span class="package-upgrade-name">${def.title}</span> ${packageLineControl(def)} <span class="package-built-status">✓ booked</span> <button type="button" class="remove-upgrade" data-base-package-remove="${key}">remove</button><strong class="package-line-price">${formatMoney(packageBaseLinePrice(key))}</strong></li>`;
  const items = def.items.map(item => `<li class="package-upgrade-line package-base-line" data-shoot-date="${packageDateAttr(shootDate)}" data-base-package-line="${key}">${item}</li>`).join('');
  list.insertAdjacentHTML('beforeend', title + items);
  syncPackageDateHeaders();
  refreshBasePackagePrices();
  syncHomeGridHeight();
}
function refreshBasePackageItem(key, date = '') {
  const selector = date ? `.package-base-title[data-base-package-line="${key}"][data-shoot-date="${packageDateSelector(date)}"]` : `.package-base-title[data-base-package-line="${key}"]`;
  const titleLine = document.querySelector(selector);
  if (!titleLine) return;
  const def = basePackageDefinitions()[key];
  if (!def) return;
  const value = builderValue(def.controlKey || key);
  if (def.control === 'hours') titleLine.dataset.hours = value;
  if (def.control === 'qty') titleLine.dataset.qty = value;
  titleLine.querySelector('.package-upgrade-name')?.replaceChildren(document.createTextNode(def.title));
  const oldControl = titleLine.querySelector('.package-line-control');
  if (oldControl) oldControl.outerHTML = packageLineControl(def);
  const dateForLine = titleLine.dataset.shootDate || originalPackageDate();
  const keys = basePackageEntries().filter(entry => entry.date === dateForLine).map(entry => entry.key);
  const meta = {key, date: dateForLine, hours: Number(titleLine.dataset.hours || 0), qty: Number(titleLine.dataset.qty || 1)};
  titleLine.querySelector('.package-line-price')?.replaceChildren(document.createTextNode(formatMoney(packageBaseItemPrice(key, keys, meta))));
  const itemLines = Array.from(document.querySelectorAll(`.package-base-line[data-base-package-line="${key}"]`));
  def.items.forEach((item, index) => itemLines[index]?.replaceChildren(document.createTextNode(item)));
}
function removeBasePackageItem(key, date = '') {
  const selector = date ? `[data-base-package-line="${key}"][data-shoot-date="${packageDateSelector(date)}"]` : `[data-base-package-line="${key}"]`;
  document.querySelectorAll(selector).forEach(line => line.remove());
  syncPackageDateHeaders();
  refreshBasePackagePrices();
  syncHomeGridHeight();
}
function builderCanSelect(key, keys = basePackageKeys()) {
  return !keys.includes(key);
}
function packageLineControl(def) {
  if (!def.control) return '';
  const key = def.controlKey;
  const label = def.control === 'hours' ? `${builderValue(key)} hr` : (key === 'retouching' ? `${builderValue(key)} photos` : `${builderValue(key)}`);
  return `<span class="package-line-control" data-package-line-control="${key}"><button type="button" data-package-line-adjust="${key}" data-delta="-1">−</button><strong>${label}</strong><button type="button" data-package-line-adjust="${key}" data-delta="1">+</button></span>`;
}
function upgradeLineTitle(upgrade, title) {
  if (!['photo-one','photo-second','video-one','video-second','content-creator','content-creation-package'].includes(upgrade)) return title;
  return String(title || '').replace(/, \d+ hours?$/i, '');
}
function upgradeLineControl(upgrade, hours) {
  const controlled = ['photo-one','photo-second','video-one','video-second','content-creator','content-creation-package'];
  if (!controlled.includes(upgrade)) return '';
  return `<span class="package-line-control" data-package-upgrade-line-control="${upgrade}"><button type="button" data-package-upgrade-line-adjust="${upgrade}" data-delta="-1">−</button><strong>${Number(hours || 8)} hr</strong><button type="button" data-package-upgrade-line-adjust="${upgrade}" data-delta="1">+</button></span>`;
}
function refreshPackageUpgradeItem(upgrade) {
  const titleLine = document.querySelector(`.package-upgrade-title[data-upgrade-line="${upgrade}"]`);
  if (!titleLine) return;
  const hours = Number(titleLine.dataset.hours || 8);
  const name = titleLine.querySelector('.package-upgrade-name');
  if (name && ['photo-one','photo-second','video-one','video-second','content-creator','content-creation-package'].includes(upgrade)) {
    const baseTitle = {
      'photo-one':'One Photographer',
      'photo-second':'Second Photographer',
      'video-one':'One Videographer',
      'video-second':'Second Videographer',
      'content-creator':'Content Creator',
      'content-creation-package':'Content Creation Package'
    }[upgrade];
    name.textContent = baseTitle;
  }
  const control = titleLine.querySelector('[data-package-upgrade-line-control] strong');
  if (control) control.textContent = `${hours} hr`;
  titleLine.querySelector('.package-line-price')?.replaceChildren(document.createTextNode(formatMoney(packageUpgradeLinePrice(titleLine))));
}
function refreshPackageUpgradePrices() {
  document.querySelectorAll('.package-list .package-upgrade-title[data-upgrade-line]').forEach(titleLine => {
    titleLine.querySelector('.package-line-price')?.replaceChildren(document.createTextNode(formatMoney(packageUpgradeLinePrice(titleLine))));
  });
}
function renderBuilderControl(def) {
  return '';
}
function renderBuilderName(def) {
  const professionalSuffix = ', Professional Album Design';
  if (def.title && def.title.endsWith(professionalSuffix)) {
    return `<span class="builder-name"><span>${def.title.slice(0, -professionalSuffix.length)}</span><span class="builder-name-sub">Professional Album Design</span></span>`;
  }
  return `<span class="builder-name">${def.title}</span>`;
}
function syncPackageBuilderState(ctx = packageUpgradeState()) {
  const builder = document.querySelector('.package-builder');
  const grid = document.querySelector('.package-builder-grid');
  const list = document.querySelector('.package-list');
  if (!builder || !grid || !list) return;
  syncPackageDateHeaders();
  const hasAnyPackage = list.children.length > 0;
  if (!hasAnyPackage) builderState().done = false;
  const keys = activeBasePackageKeys();
  const defs = basePackageDefinitions(ctx);
  builder.classList.toggle('has-package-items', hasAnyPackage);
  const copy = builder.querySelector('.package-empty-copy');
  if (copy) copy.textContent = hasAnyPackage ? `Build package for ${packageDateLabel(activePackageDate())}.` : 'No package has been added yet. Build the client’s booked package below.';
  builder.hidden = !state.isAdmin || !!builderState().done;
  const addDayButton = document.querySelector('[data-package-builder-add-day]');
  if (addDayButton) addDayButton.hidden = !state.isAdmin;
  const toggle = document.querySelector('[data-package-builder-toggle]');
  syncPackageBuilderCalendar();
  if (toggle) {
    toggle.hidden = !state.isAdmin;
    toggle.innerHTML = builderState().done ? '<svg class="package-builder-edit-icon" viewBox="0 0 494.936 494.936" aria-hidden="true"><path d="M389.844 182.85c-6.743 0-12.21 5.467-12.21 12.21v222.968c0 23.562-19.174 42.735-42.736 42.735H67.157c-23.562 0-42.736-19.174-42.736-42.735V150.285c0-23.562 19.174-42.735 42.736-42.735h267.741c6.743 0 12.21-5.467 12.21-12.21s-5.467-12.21-12.21-12.21H67.157C30.126 83.13 0 113.255 0 150.285v267.743c0 37.029 30.126 67.155 67.157 67.155h267.741c37.03 0 67.156-30.126 67.156-67.155V195.061c0-6.743-5.467-12.211-12.21-12.211z"></path><path d="M483.876 20.791c-14.72-14.72-38.669-14.714-53.377 0L221.352 229.944c-.28.28-3.434 3.559-4.251 5.396l-28.963 65.069c-2.057 4.619-1.056 10.027 2.521 13.6 2.337 2.336 5.461 3.576 8.639 3.576 1.675 0 3.362-.346 4.96-1.057l65.07-28.963c1.83-.815 5.114-3.97 5.396-4.25L483.876 74.169c7.131-7.131 11.06-16.61 11.06-26.692 0-10.081-3.929-19.562-11.06-26.686zM466.61 56.897 257.457 266.05c-.035.036-.055.078-.089.107l-33.989 15.131L238.51 247.3c.03-.036.071-.055.107-.09L447.765 38.058c5.038-5.039 13.819-5.033 18.846.005 2.518 2.51 3.905 5.855 3.905 9.414 0 3.559-1.389 6.903-3.906 9.42z"></path></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>';
    toggle.setAttribute('aria-label', builderState().done ? 'Edit package' : 'Done building package');
    toggle.classList.toggle('is-edit-mode', builderState().done);
  }
  const shortShootDate = activePackageDate() !== originalPackageDate();
  const groupRank = shortShootDate
    ? {Elopement:1, Photography:2, Videography:3, 'Content Creation':4, 'Photo Booth':5, 'Sneak Peek':6}
    : {Photography:1, Videography:2, 'Content Creation':3, 'Photo Booth':4, 'Sneak Peek':5, Elopement:6};
  const itemRank = {
    'photo-one':1, 'elopement-photo-one':1, 'photo-second':2, engagement:3, 'photo-book-10':4, 'photo-book-10-design':5, 'photo-book-12':6, 'photo-book-12-design':7, 'premium-photo-package':8, 'expedited-photo':9, 'premium-photo-editing':10, retouching:11,
    'video-one':1, 'elopement-video-one':1, 'video-second':2, 'video-cinematography':3, 'video-trailer':4, 'video-extended':5, 'video-traditional':6, 'premium-video-package':7,
    'content-creator':1, 'content-package':2, 'elopement-photo-one':1, 'elopement-video-one':2, 'elopement-officiant':3, 'elopement-content-creator':4, 'elopement-content-package':5
  };
  const ordered = Object.entries(defs).filter(([key]) => !keys.includes(key)).filter(([key]) => shortShootDate ? !['content-creator','content-package'].includes(key) : true).sort(([akey, a], [bkey, b]) => ((groupRank[a.group] || 99) - (groupRank[b.group] || 99)) || ((itemRank[akey] || 50) - (itemRank[bkey] || 50)) || akey.localeCompare(bkey));
  let currentGroup = '';
  grid.innerHTML = ordered.map(([key, def]) => {
    const disabled = !builderCanSelect(key, keys);
    const groupTitle = def.group !== currentGroup ? (currentGroup = def.group, `<h4 class="builder-group-title">${def.group}</h4>`) : '';
    return `${groupTitle}<div class="package-builder-card ${disabled ? 'is-builder-disabled' : ''}" data-builder-card="${key}"><button type="button" data-package-build="${key}" ${disabled ? 'disabled' : ''}>${renderBuilderName(def)}</button>${renderBuilderControl(def)}</div>`;
  }).join('');
}
function showUpgradeNotice(message) {
  const notice = document.querySelector('.upgrade-notice');
  if (!notice || !message) return;
  notice.textContent = message;
  notice.hidden = false;
}
function updateDynamicUpgradePrices() {
  const ctx = packageUpgradeState();
  document.querySelector('[data-dynamic-price="photo-booth-3"]')?.replaceChildren(document.createTextNode(`$${photoBoothPrice(3, ctx)}`));
  document.querySelector('[data-dynamic-price="photo-booth-4"]')?.replaceChildren(document.createTextNode(`$${photoBoothPrice(4, ctx)}`));
  document.querySelector('[data-dynamic-price="photo-booth-range"]')?.replaceChildren(document.createTextNode(`$${photoBoothPrice(3, ctx)} / $${photoBoothPrice(4, ctx)}`));
  const premium = premiumVideoUpgrade(ctx);
  document.querySelector('[data-dynamic-price="premium-video"]')?.replaceChildren(document.createTextNode(`$${premium?.price || 299}`));
  const premiumList = document.querySelector('[data-premium-video-items]');
  if (premiumList && premium) premiumList.innerHTML = premium.items.map(item => `<li>${item}</li>`).join('');
}
function togglePaymentPlusPopup() {
  if (!state.isAdmin) return;
  const popup = document.querySelector('[data-payment-plus-popup]');
  if (popup) popup.hidden = !popup.hidden;
}
function closePaymentPlusPopup() {
  document.querySelector('[data-payment-plus-popup]')?.setAttribute('hidden', '');
}
function updatePackageBalance() {
  const payCopy = document.querySelector('.tile-pay p');
  if (!payCopy) return;
  const payments = packagePaymentRows();
  const adjustments = paymentAdjustmentState();
  const adjustmentHtml = adjustments.map(row => {
    const value = row.raw ?? (row.amount ? String(row.amount) : '');
    const cleanLength = String(value).replace('-', '').length || 1;
    const inputWidth = value ? Math.max(1.2, cleanLength * 0.62 + (String(value).startsWith('-') ? 0.45 : 0)) : 1.2;
    const isEditableAdjustment = true;
    const labelHtml = isEditableAdjustment && row.renaming && state.isAdmin ? `<input class="payment-adjustment-label-input" type="text" value="${row.label}" data-payment-adjustment-label="${row.id}">` : `<span class="payment-adjustment-label-text">${row.label}:</span>`;
    const amountHtml = isEditableAdjustment && !row.renaming
      ? `<strong class="payment-adjustment-static-amount">${formatMoney(row.amount)}</strong><button type="button" class="payment-adjustment-rename" data-payment-adjustment-rename="${row.id}" aria-label="Edit ${row.label}"><svg viewBox="0 0 494.936 494.936" aria-hidden="true"><path d="M389.844 182.85c-6.743 0-12.21 5.467-12.21 12.21v222.968c0 23.562-19.174 42.735-42.736 42.735H67.157c-23.562 0-42.736-19.174-42.736-42.735V150.285c0-23.562 19.174-42.735 42.736-42.735h267.741c6.743 0 12.21-5.467 12.21-12.21s-5.467-12.21-12.21-12.21H67.157C30.126 83.13 0 113.255 0 150.285v267.743c0 37.029 30.126 67.155 67.157 67.155h267.741c37.03 0 67.156-30.126 67.156-67.155V195.061c0-6.743-5.467-12.211-12.21-12.211z"></path><path d="M483.876 20.791c-14.72-14.72-38.669-14.714-53.377 0L221.352 229.944c-.28.28-3.434 3.559-4.251 5.396l-28.963 65.069c-2.057 4.619-1.056 10.027 2.521 13.6 2.337 2.336 5.461 3.576 8.639 3.576 1.675 0 3.362-.346 4.96-1.057l65.07-28.963c1.83-.815 5.114-3.97 5.396-4.25L483.876 74.169c7.131-7.131 11.06-16.61 11.06-26.692 0-10.081-3.929-19.562-11.06-26.686zM466.61 56.897 257.457 266.05c-.035.036-.055.078-.089.107l-33.989 15.131L238.51 247.3c.03-.036.071-.055.107-.09L447.765 38.058c5.038-5.039 13.819-5.033 18.846.005 2.518 2.51 3.905 5.855 3.905 9.414 0 3.559-1.389 6.903-3.906 9.42z"></path></svg></button>`
      : `<label class="payment-adjustment-input-wrap"><span class="payment-adjustment-dollar ${value ? '' : 'is-empty'}">$</span><input type="text" inputmode="decimal" value="${value}" style="width:${inputWidth}ch" data-payment-adjustment-amount="${row.id}" ${state.isAdmin ? '' : 'readonly tabindex="-1"'}></label><button type="button" class="payment-adjustment-done" data-payment-adjustment-done="${row.id}" aria-label="Done editing ${row.label}">✓</button>`;
    return `<span class="pay-breakdown-row pay-adjustment-row pay-adjustment-row-other ${row.renaming ? 'is-editing' : ''}" data-payment-adjustment-row="${row.id}"><span class="payment-adjustment-label"><button type="button" class="payment-adjustment-remove" data-payment-adjustment-remove="${row.id}" aria-label="Remove ${row.label}">×</button>${labelHtml}</span><span class="payment-adjustment-amount-cell">${amountHtml}</span></span>`;
  }).join('');
  const clientUpgradeRows = packageClientUpgradeRows();
  const clientUpgradeHtml = clientUpgradeRows.length ? `<span class="pay-breakdown-upgrades"><span class="pay-upgrades-title">Upgrades:</span>${clientUpgradeRows.map(row => `<span class="pay-breakdown-row pay-client-upgrade-row"><span>${row.label}</span><strong>${formatMoney(row.amount)}</strong></span>`).join('')}</span>` : '';
  const bundledSavings = packageBundledSavings();
  const displayedPackagePrice = packageCurrentPrice() + bundledSavings;
  const bundledSavingsHtml = bundledSavings > 0 ? `<span class="pay-breakdown-row pay-bundled-savings"><span>Bundled Savings:</span><strong>−${formatMoney(bundledSavings)}</strong></span>` : '';
  const paymentsHtml = payments.length ? `<span class="pay-breakdown-payments"><span class="pay-payments-title">Payments:</span>${payments.map(row => `<span class="pay-breakdown-row pay-payment-row"><span class="pay-payment-meta"><span>${row.date}</span><em class="pay-method-tag">${row.method}</em></span><strong>−${formatMoney(row.amount)}</strong></span>`).join('')}</span>` : '';
  payCopy.innerHTML = `<span class="pay-breakdown-row"><span>Package Price:</span><strong>${formatMoney(displayedPackagePrice)}</strong></span>${bundledSavingsHtml}<span class="pay-breakdown-row"><span>Sales Tax (8.875%):</span><strong>${formatMoney(packageSalesTax())}</strong></span>${adjustmentHtml}${clientUpgradeHtml}<span class="pay-breakdown-row pay-grand-total"><span>Grand Total:</span><strong>${formatMoney(packageGrandTotal())}</strong></span>${paymentsHtml}<span class="pay-breakdown-row pay-balance"><span>Balance:</span><strong>${formatMoney(packageGrandTotal() - payments.reduce((sum, row) => sum + row.amount, 0))}</strong></span>`;
}
function openUpgradeChoice(type) {
  const popup = document.querySelector('.upgrade-choice-popup');
  if (!popup) return;
  document.body.appendChild(popup);
  const ctx = packageUpgradeState();
  if (type === 'photography') {
    window.__photoChoice = {date: '', status: 'idle', selected: '', secondSelected: false, hours: {one: 8, second: 8}, calendarMonth: '', calendarOpen: false};
    renderPhotographyChoicePopup();
  } else if (type === 'photo-booth') {
    window.__photoBoothAvailability = {date: '', status: 'idle', selected: '', calendarMonth: '', calendarOpen: false};
    renderPhotoBoothChoicePopup();
  } else if (type === 'content-creation') {
    window.__contentCreationChoice = {date: '', status: 'idle', selected: '', hours: {creator: 8, package: 8}, calendarMonth: '', calendarOpen: false};
    renderContentCreationChoicePopup();
  } else if (type === 'videography') {
    window.__videoChoice = {date: '', status: 'idle', selected: '', secondSelected: false, editOnly: false, hours: {one: 8, second: 8}, edits: [], calendarMonth: '', calendarOpen: false};
    renderVideoChoicePopup();
  } else if (type === 'video-editing-only') {
    const ctx = packageUpgradeState();
    window.__videoChoice = {date: '', status: 'idle', selected: 'video-one', secondSelected: /second videographer/i.test(ctx.packageText), editOnly: true, hours: {one: 8, second: 8}, edits: [], calendarMonth: '', calendarOpen: false};
    renderVideoChoicePopup();
  } else if (type === 'photo-book') {
    window.__photoBookChoice = window.__photoBookChoice || {};
    popup.innerHTML = `<h4>Choose your Photo Book</h4><div class="upgrade-choice-grid"><div class="upgrade-choice-card book-choice" data-book-choice="photo-book-10"><strong>10x10, 30 pages</strong><small>DIY album design</small><span>$519</span><div class="book-qty"><button type="button" data-book-minus="photo-book-10">−</button><em data-book-qty="photo-book-10">0</em><button type="button" data-book-plus="photo-book-10">+</button></div></div><div class="upgrade-choice-card book-choice" data-book-choice="photo-book-12"><strong>12x12, 30 pages</strong><small>DIY album design</small><span>$569</span><div class="book-qty"><button type="button" data-book-minus="photo-book-12">−</button><em data-book-qty="photo-book-12">0</em><button type="button" data-book-plus="photo-book-12">+</button></div></div></div><div class="upgrade-choice-pro"><p>Want us to design it for you?</p><div class="upgrade-choice-grid"><div class="upgrade-choice-card book-choice" data-book-choice="photo-book-10-pro"><strong>10x10, 30 pages</strong><small>Professional album design</small><span>$619</span><div class="book-qty"><button type="button" data-book-minus="photo-book-10-pro">−</button><em data-book-qty="photo-book-10-pro">0</em><button type="button" data-book-plus="photo-book-10-pro">+</button></div></div><div class="upgrade-choice-card book-choice" data-book-choice="photo-book-12-pro"><strong>12x12, 30 pages</strong><small>Professional album design</small><span>$669</span><div class="book-qty"><button type="button" data-book-minus="photo-book-12-pro">−</button><em data-book-qty="photo-book-12-pro">0</em><button type="button" data-book-plus="photo-book-12-pro">+</button></div></div></div></div><button type="button" class="upgrade-choice-submit" data-photo-book-submit>add to package</button><button type="button" class="upgrade-choice-cancel" data-upgrade-choice-close>cancel</button>`;
    syncPhotoBookChoicePopup();
  }
  popup.hidden = false;
  syncHomeGridHeight();
}
function renderPhotographyChoicePopup() {
  const popup = document.querySelector('.upgrade-choice-popup');
  if (!popup) return;
  const state = photoChoiceState();
  const oneHours = state.hours.one || 8;
  const secondHours = state.hours.second || 8;
  const canSubmit = state.status === 'available' && state.selected === 'photo-one';
  const disabledClass = state.status !== 'available' ? 'is-disabled' : '';
  const secondDisabledClass = state.status !== 'available' || state.selected !== 'photo-one' ? 'is-disabled is-dependent-disabled' : '';
  const dateSection = `<section class="booth-date-check"><div class="booth-date-row"><label><span>Event date</span><button type="button" class="booth-date-display" data-photo-calendar-toggle>${formatBoothDate(state.date) || 'Select event date'}</button><input type="hidden" data-photo-date value="${state.date || ''}"></label><button type="button" class="blue-btn booth-check-btn" data-photo-check ${state.date ? '' : 'disabled'}>check availability</button></div>${renderPhotoCalendar(state.date, state.calendarOpen !== false)}${photoAvailabilityStatusHtml(state)}</section>`;
  popup.innerHTML = `<h4>Choose Photography</h4>${dateSection}<div class="upgrade-choice-grid video-choice-grid photography-choice-grid"><div class="upgrade-choice-card content-choice video-choice photography-choice ${disabledClass} ${state.selected === 'photo-one' ? 'is-selected' : ''}" data-photo-choice="photo-one"><strong>One Photographer</strong><span class="video-price">$${photoCoveragePrice('one', oneHours)}</span><ul><li>${oneHours} hours</li><li>Average of ${photoAverageImages('one', oneHours)} edited images</li><li>Online photo gallery store</li><li>Highlight Photography Page</li><li>Digital download of high resolution images</li><li>Full printing rights (no watermarks)</li><li>Free Guest upload link & QR Code</li></ul><div class="book-qty content-hours"><button type="button" data-photo-hours-minus="one">−</button><em>${oneHours} hrs</em><button type="button" data-photo-hours-plus="one">+</button></div></div><div class="upgrade-choice-card content-choice video-choice photography-choice ${secondDisabledClass} ${state.secondSelected ? 'is-selected' : ''}" data-photo-choice="photo-second"><strong>Second Photographer</strong><span class="video-price">$${photoCoveragePrice('second', secondHours)}</span><ul><li>${secondHours} hours</li><li>Average of ${photoAverageImages('second', secondHours)} edited images</li><li>Online photo gallery store</li><li>Highlight Photography Page</li><li>Digital download of high resolution images</li><li>Full printing rights (no watermarks)</li><li>Free Guest upload link & QR Code</li></ul><div class="book-qty content-hours"><button type="button" data-photo-hours-minus="second">−</button><em>${secondHours} hrs</em><button type="button" data-photo-hours-plus="second">+</button></div></div></div><button type="button" class="upgrade-choice-submit video-choice-submit" data-photo-submit ${canSubmit ? '' : 'disabled'}>add to package</button><button type="button" class="upgrade-choice-cancel" data-upgrade-choice-close>cancel</button>`;
}
function photoCalendarState(baseDate) {
  const state = photoChoiceState();
  const source = state.calendarMonth || baseDate;
  const current = source ? new Date(`${source}T12:00:00`) : new Date();
  return {year: current.getFullYear(), month: current.getMonth()};
}
function renderPhotoCalendar(selectedDate = '', open = true) {
  const {year, month} = photoCalendarState(selectedDate);
  const first = new Date(year, month, 1);
  const today = new Date(); today.setHours(0,0,0,0);
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const viewedMonth = new Date(year, month, 1);
  const canGoPrev = viewedMonth > currentMonth;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = first.getDay();
  const label = first.toLocaleDateString(undefined, {month:'long', year:'numeric'});
  const cells = [];
  for (let i=0; i<leading; i++) cells.push('<span></span>');
  for (let day=1; day<=daysInMonth; day++) {
    const value = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const disabled = new Date(year, month, day) < today;
    const classes = [value === selectedDate ? 'is-selected' : '', disabled ? 'is-disabled' : ''].filter(Boolean).join(' ');
    cells.push(`<button type="button" class="${classes}" data-photo-date-pick="${value}" ${disabled ? 'disabled aria-disabled="true"' : ''}>${day}</button>`);
  }
  return `<div class="booth-calendar photo-calendar ${open ? 'is-open' : ''}" data-photo-calendar><div class="booth-calendar-head"><button type="button" data-photo-month-prev ${canGoPrev ? '' : 'disabled aria-disabled="true"'}>‹</button><strong>${label}</strong><button type="button" data-photo-month-next>›</button></div><div class="booth-calendar-days"><span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span></div><div class="booth-calendar-grid">${cells.join('')}</div></div>`;
}
function photoAvailabilityStatusHtml(state) {
  if (state.status === 'checking') return `<div class="booth-availability-status"><span class="booth-spinner"></span>Checking our calendar...</div>`;
  if (state.status === 'available') return `<div class="booth-availability-status is-available"><strong>Great news, we’re available.</strong><p>Your date looks open for photography coverage. You can add it to your package now, and our studio will still do a final manual review for staffing and scheduling.</p></div>`;
  return `<p class="booth-availability-help">Choose your event date first so we can check availability.</p>`;
}
function setPhotoDate(value) { const state = photoChoiceState(); window.__photoChoice = {...state, date:value, status:'idle', selected:'', secondSelected:false, calendarMonth:value, calendarOpen:false}; renderPhotographyChoicePopup(); }
function shiftPhotoCalendar(delta) { const state = photoChoiceState(); const {year, month} = photoCalendarState(state.date || ''); const next = new Date(year, month + delta, 1); window.__photoChoice = {...state, calendarMonth:`${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}-01`, calendarOpen:true}; renderPhotographyChoicePopup(); }
function checkPhotoAvailability() { const state = photoChoiceState(); if (!state.date) return; window.__photoChoice = {...state, status:'checking', calendarOpen:false}; renderPhotographyChoicePopup(); setTimeout(() => { const current = photoChoiceState(); window.__photoChoice = {...current, status:'available'}; renderPhotographyChoicePopup(); }, 1800); }
function changePhotoHours(type, delta) { const state = photoChoiceState(); const key = type === 'second' ? 'second' : 'one'; const hours = Math.max(6, (state.hours[key] || 8) + delta); window.__photoChoice = {...state, hours:{...state.hours, [key]:hours}}; renderPhotographyChoicePopup(); }
function selectPhotoChoice(key) { const state = photoChoiceState(); if (state.status !== 'available') return; if (key === 'photo-second') { if (state.selected !== 'photo-one') return; window.__photoChoice = {...state, secondSelected: !state.secondSelected}; } else { window.__photoChoice = {...state, selected:'photo-one'}; } renderPhotographyChoicePopup(); }
function submitPhotoChoice() { const state = photoChoiceState(); if (state.status !== 'available' || state.selected !== 'photo-one') return; addPackageUpgrade('photo-one', 1, {keepChoiceOpen:true}); if (state.secondSelected) addPackageUpgrade('photo-second'); else closeUpgradeChoice(), updatePackageBalance(), syncHomeGridHeight(); window.__photoChoice = {date: state.date || '', status:'idle', selected:'', secondSelected:false, hours:state.hours, calendarMonth:state.calendarMonth || '', calendarOpen:false}; }
function formatBoothDate(value) {
  if (!value) return '';
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'});
}
function boothCalendarState(baseDate) {
  const availability = window.__photoBoothAvailability || {};
  const source = availability.calendarMonth || baseDate;
  const current = source ? new Date(`${source}T12:00:00`) : new Date();
  return {year: current.getFullYear(), month: current.getMonth()};
}
function renderBoothCalendar(selectedDate = '', open = true) {
  const {year, month} = boothCalendarState(selectedDate);
  const first = new Date(year, month, 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const viewedMonth = new Date(year, month, 1);
  const canGoPrev = viewedMonth > currentMonth;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = first.getDay();
  const label = first.toLocaleDateString(undefined, {month: 'long', year: 'numeric'});
  const cells = [];
  for (let i = 0; i < leading; i++) cells.push('<span></span>');
  for (let day = 1; day <= daysInMonth; day++) {
    const value = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const cellDate = new Date(year, month, day);
    const disabled = cellDate < today;
    const classes = [value === selectedDate ? 'is-selected' : '', disabled ? 'is-disabled' : ''].filter(Boolean).join(' ');
    cells.push(`<button type="button" class="${classes}" data-booth-date-pick="${value}" ${disabled ? 'disabled aria-disabled="true"' : ''}>${day}</button>`);
  }
  return `<div class="booth-calendar ${open ? 'is-open' : ''}" data-booth-calendar><div class="booth-calendar-head"><button type="button" data-booth-month-prev aria-label="Previous month" ${canGoPrev ? '' : 'disabled aria-disabled="true"'}>‹</button><strong>${label}</strong><button type="button" data-booth-month-next aria-label="Next month">›</button></div><div class="booth-calendar-days"><span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span></div><div class="booth-calendar-grid">${cells.join('')}</div></div>`;
}
function setPhotoBoothDate(value) {
  window.__photoBoothAvailability = {date: value, status: 'idle', selected: '', calendarMonth: value, calendarOpen: false};
  renderPhotoBoothChoicePopup();
}
function shiftPhotoBoothCalendar(delta) {
  const availability = window.__photoBoothAvailability || {};
  const {year, month} = boothCalendarState(availability.date || '');
  const next = new Date(year, month + delta, 1);
  const value = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`;
  window.__photoBoothAvailability = {...availability, calendarMonth: value, calendarOpen: true};
  renderPhotoBoothChoicePopup();
}
function renderPhotoBoothChoicePopup() {
  const popup = document.querySelector('.upgrade-choice-popup');
  if (!popup) return;
  const ctx = packageUpgradeState();
  const availability = window.__photoBoothAvailability || {date: '', status: 'idle', selected: '', calendarMonth: '', calendarOpen: false};
  const statusHtml = availability.status === 'checking'
    ? `<div class="booth-availability-status"><span class="booth-spinner"></span>Checking our calendar...</div>`
    : availability.status === 'available'
      ? `<div class="booth-availability-status is-available"><strong>Great news, we’re available.</strong><p>Your date looks open for Photo Booth coverage. You can add it to your package now, and our studio will still do a final manual review for staffing and scheduling. If anything needs attention, we’ll contact you right away.</p></div>`
      : `<p class="booth-availability-help">Choose your event date first so we can check availability.</p>`;
  const optionsDisabled = availability.status !== 'available' ? 'disabled aria-disabled="true"' : '';
  const canSubmit = availability.status === 'available' && availability.selected;
  popup.innerHTML = `<h4>Choose your Photo Booth</h4><section class="booth-date-check"><div class="booth-date-row"><label><span>Event date</span><button type="button" class="booth-date-display" data-booth-calendar-toggle>${formatBoothDate(availability.date) || 'Select event date'}</button><input type="hidden" data-booth-date value="${availability.date || ''}"></label><button type="button" class="blue-btn booth-check-btn" data-booth-check ${availability.date ? '' : 'disabled'}>check availability</button></div>${renderBoothCalendar(availability.date, availability.calendarOpen !== false)}${statusHtml}</section><div class="upgrade-choice-grid booth-choice-grid"><button type="button" class="upgrade-choice-card booth-choice ${availability.selected === 'photo-booth-3' ? 'is-selected' : ''}" data-booth-choice="photo-booth-3" ${optionsDisabled}><strong>3-Hour Rental</strong><span>$${photoBoothPrice(3, ctx)}</span><ul><li>Set up &amp; Break down</li><li>Photo Booth Attendant for the duration of your rental</li><li>Unlimited Printing (4x6 or 2x6 prints)</li><li>Backdrop and Props</li><li>Parking must be provided</li></ul></button><button type="button" class="upgrade-choice-card booth-choice ${availability.selected === 'photo-booth-4' ? 'is-selected' : ''}" data-booth-choice="photo-booth-4" ${optionsDisabled}><strong>4-Hour Rental</strong><span>$${photoBoothPrice(4, ctx)}</span><ul><li>Set up &amp; Break down</li><li>Photo Booth Attendant for the duration of your rental</li><li>Unlimited Printing of (4x6 or 2x6 prints)</li><li>Backdrop and Props</li><li>Online Photo Gallery of all images</li><li>Parking must be provided</li></ul></button></div><button type="button" class="upgrade-choice-submit booth-choice-submit" data-photo-booth-submit ${canSubmit ? '' : 'disabled'}>add to package</button><button type="button" class="upgrade-choice-cancel" data-upgrade-choice-close>cancel</button>`;
}
function checkPhotoBoothAvailability() {
  const input = document.querySelector('[data-booth-date]');
  const date = input?.value || '';
  window.__photoBoothAvailability = {...(window.__photoBoothAvailability || {}), date, status: 'checking', calendarOpen: false};
  renderPhotoBoothChoicePopup();
  setTimeout(() => {
    window.__photoBoothAvailability = {...(window.__photoBoothAvailability || {}), date, status: 'available', selected: ''};
    renderPhotoBoothChoicePopup();
  }, 1800);
}
function notifyUpgradeRequest(def, upgrade, quantity = 1) {
  const payload = {
    upgrade,
    title: def?.title || upgrade,
    quantity: Number(quantity || 1),
    price: def?.price || 0,
    client: document.querySelector('.client-name')?.textContent.trim() || 'Wedding dashboard client',
    eventDate: state.eventInfo?.eventDate || '',
    requestedAt: new Date().toISOString()
  };
  fetch('/api/upgrade-email.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  }).catch(() => console.info('Upgrade email notification pending backend endpoint:', payload));
}
function selectPhotoBoothChoice(key) {
  const availability = window.__photoBoothAvailability || {date: '', status: 'idle', selected: '', calendarMonth: '', calendarOpen: false};
  if (availability.status !== 'available') return;
  window.__photoBoothAvailability = {...availability, selected: key};
  renderPhotoBoothChoicePopup();
}
function submitPhotoBoothChoice() {
  const availability = window.__photoBoothAvailability || {};
  if (availability.status !== 'available' || !availability.selected) return;
  addPackageUpgrade(availability.selected);
  window.__photoBoothAvailability = {date: availability.date || '', status: 'idle', selected: '', calendarMonth: availability.calendarMonth || '', calendarOpen: false};
}
function formatContentDate(value) { return formatBoothDate(value); }
function contentCalendarState(baseDate) {
  const state = contentCreationChoiceState();
  const source = state.calendarMonth || baseDate;
  const current = source ? new Date(`${source}T12:00:00`) : new Date();
  return {year: current.getFullYear(), month: current.getMonth()};
}
function renderContentCalendar(selectedDate = '', open = true) {
  const {year, month} = contentCalendarState(selectedDate);
  const first = new Date(year, month, 1);
  const today = new Date(); today.setHours(0,0,0,0);
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const viewedMonth = new Date(year, month, 1);
  const canGoPrev = viewedMonth > currentMonth;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = first.getDay();
  const label = first.toLocaleDateString(undefined, {month:'long', year:'numeric'});
  const cells = [];
  for (let i=0; i<leading; i++) cells.push('<span></span>');
  for (let day=1; day<=daysInMonth; day++) {
    const value = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const disabled = new Date(year, month, day) < today;
    const classes = [value === selectedDate ? 'is-selected' : '', disabled ? 'is-disabled' : ''].filter(Boolean).join(' ');
    cells.push(`<button type="button" class="${classes}" data-content-date-pick="${value}" ${disabled ? 'disabled aria-disabled="true"' : ''}>${day}</button>`);
  }
  return `<div class="booth-calendar content-calendar ${open ? 'is-open' : ''}" data-content-calendar><div class="booth-calendar-head"><button type="button" data-content-month-prev ${canGoPrev ? '' : 'disabled aria-disabled="true"'}>‹</button><strong>${label}</strong><button type="button" data-content-month-next>›</button></div><div class="booth-calendar-days"><span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span></div><div class="booth-calendar-grid">${cells.join('')}</div></div>`;
}
function contentAvailabilityStatusHtml(state) {
  if (state.status === 'checking') return `<div class="booth-availability-status"><span class="booth-spinner"></span>Checking our calendar...</div>`;
  if (state.status === 'available') return `<div class="booth-availability-status is-available"><strong>Great news, we’re available.</strong><p>Your date looks open for Content Creation. You can add it to your package now, and our studio will still do a final manual review for staffing and scheduling.</p></div>`;
  return `<p class="booth-availability-help">Choose your event date first so we can check availability.</p>`;
}
function renderContentCreationChoicePopup() {
  const popup = document.querySelector('.upgrade-choice-popup');
  if (!popup) return;
  const state = contentCreationChoiceState();
  const creatorHours = state.hours.creator || 8;
  const packageHours = state.hours.package || 8;
  const canSubmit = state.status === 'available' && state.selected;
  const disabledClass = state.status !== 'available' ? 'is-disabled' : '';
  popup.innerHTML = `<h4>Choose Content Creation</h4><section class="booth-date-check"><div class="booth-date-row"><label><span>Event date</span><button type="button" class="booth-date-display" data-content-calendar-toggle>${formatContentDate(state.date) || 'Select event date'}</button><input type="hidden" data-content-date value="${state.date || ''}"></label><button type="button" class="blue-btn booth-check-btn" data-content-check ${state.date ? '' : 'disabled'}>check availability</button></div>${renderContentCalendar(state.date, state.calendarOpen !== false)}${contentAvailabilityStatusHtml(state)}</section><div class="upgrade-choice-grid content-choice-grid"><div class="upgrade-choice-card content-choice ${disabledClass} ${state.selected === 'content-creator' ? 'is-selected' : ''}" data-content-choice="content-creator"><strong>Content Creator</strong><span>$${contentCreationPrice('creator', creatorHours)}</span><ul><li>${creatorHours} hours</li><li>Videos shot on iPhone</li><li>All raw videos</li><li>Raw content available the same day</li><li>Digital download</li></ul><div class="book-qty content-hours"><button type="button" data-content-hours-minus="creator">−</button><em>${creatorHours} hrs</em><button type="button" data-content-hours-plus="creator">+</button></div></div><div class="upgrade-choice-card content-choice ${disabledClass} ${state.selected === 'content-creation-package' ? 'is-selected' : ''}" data-content-choice="content-creation-package"><strong>Content Creation Package</strong><span>$${contentCreationPrice('package', packageHours)}</span><ul><li>${packageHours} hours</li><li>Wedding Content Creator</li><li>Videos shot on iPhone</li><li>1 min. highlight reel recapping your big day</li><li>2 additional short reels (10-30 sec.)</li><li>All raw videos</li><li>Raw content available the same day</li><li>Digital download</li></ul><div class="book-qty content-hours"><button type="button" data-content-hours-minus="package">−</button><em>${packageHours} hrs</em><button type="button" data-content-hours-plus="package">+</button></div></div></div><button type="button" class="upgrade-choice-submit content-choice-submit" data-content-submit ${canSubmit ? '' : 'disabled'}>add to package</button><button type="button" class="upgrade-choice-cancel" data-upgrade-choice-close>cancel</button>`;
}
function setContentCreationDate(value) { const state = contentCreationChoiceState(); window.__contentCreationChoice = {...state, date:value, status:'idle', selected:'', calendarMonth:value, calendarOpen:false}; renderContentCreationChoicePopup(); }
function shiftContentCalendar(delta) { const state = contentCreationChoiceState(); const {year, month} = contentCalendarState(state.date || ''); const next = new Date(year, month + delta, 1); window.__contentCreationChoice = {...state, calendarMonth:`${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}-01`, calendarOpen:true}; renderContentCreationChoicePopup(); }
function checkContentAvailability() { const state = contentCreationChoiceState(); if (!state.date) return; window.__contentCreationChoice = {...state, status:'checking', calendarOpen:false}; renderContentCreationChoicePopup(); setTimeout(() => { const current = contentCreationChoiceState(); window.__contentCreationChoice = {...current, status:'available'}; renderContentCreationChoicePopup(); }, 1800); }
function changeContentHours(type, delta) { const state = contentCreationChoiceState(); const key = type === 'package' ? 'package' : 'creator'; const hours = Math.max(4, (state.hours[key] || 8) + delta); window.__contentCreationChoice = {...state, hours:{...state.hours, [key]:hours}}; renderContentCreationChoicePopup(); }
function selectContentChoice(key) { const state = contentCreationChoiceState(); if (state.status !== 'available') return; window.__contentCreationChoice = {...state, selected:key}; renderContentCreationChoicePopup(); }
function submitContentChoice() { const state = contentCreationChoiceState(); const selected = state.selected || document.querySelector('.content-choice.is-selected')?.dataset.contentChoice || ''; if (state.status !== 'available' || !selected) return; window.__contentCreationChoice = {...state, selected}; addPackageUpgrade(selected); window.__contentCreationChoice = {date: state.date || '', status:'idle', selected:'', hours:state.hours, calendarMonth:state.calendarMonth || '', calendarOpen:false}; }
function formatVideoDate(value) { return formatBoothDate(value); }
function videoCalendarState(baseDate) {
  const state = videoChoiceState();
  const source = state.calendarMonth || baseDate;
  const current = source ? new Date(`${source}T12:00:00`) : new Date();
  return {year: current.getFullYear(), month: current.getMonth()};
}
function renderVideoCalendar(selectedDate = '', open = true) {
  const {year, month} = videoCalendarState(selectedDate);
  const first = new Date(year, month, 1);
  const today = new Date(); today.setHours(0,0,0,0);
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const viewedMonth = new Date(year, month, 1);
  const canGoPrev = viewedMonth > currentMonth;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = first.getDay();
  const label = first.toLocaleDateString(undefined, {month:'long', year:'numeric'});
  const cells = [];
  for (let i=0; i<leading; i++) cells.push('<span></span>');
  for (let day=1; day<=daysInMonth; day++) {
    const value = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const disabled = new Date(year, month, day) < today;
    const classes = [value === selectedDate ? 'is-selected' : '', disabled ? 'is-disabled' : ''].filter(Boolean).join(' ');
    cells.push(`<button type="button" class="${classes}" data-video-date-pick="${value}" ${disabled ? 'disabled aria-disabled="true"' : ''}>${day}</button>`);
  }
  return `<div class="booth-calendar video-calendar ${open ? 'is-open' : ''}" data-video-calendar><div class="booth-calendar-head"><button type="button" data-video-month-prev ${canGoPrev ? '' : 'disabled aria-disabled="true"'}>‹</button><strong>${label}</strong><button type="button" data-video-month-next>›</button></div><div class="booth-calendar-days"><span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span></div><div class="booth-calendar-grid">${cells.join('')}</div></div>`;
}
function videoAvailabilityStatusHtml(state) {
  if (state.status === 'checking') return `<div class="booth-availability-status"><span class="booth-spinner"></span>Checking our calendar...</div>`;
  if (state.status === 'available') return `<div class="booth-availability-status is-available"><strong>Great news, we’re available.</strong><p>Your date looks open for videography. You can add it to your package now, and our studio will still do a final manual review for staffing and scheduling.</p></div>`;
  return `<p class="booth-availability-help">Choose your event date first so we can check availability.</p>`;
}
function videoPriceHtml(type, hours) {
  const ctx = packageUpgradeState();
  const price = videoCoveragePrice(type, hours, ctx);
  if (type === 'one' && hasPhotographyPackage(ctx)) return `<span class="video-price"><small>$${videoCoveragePrice('one', hours, {...ctx, packageText:''})}</small>$${price}</span>`;
  return `<span class="video-price">$${price}</span>`;
}
function renderVideoChoicePopup() {
  const popup = document.querySelector('.upgrade-choice-popup');
  if (!popup) return;
  const state = videoChoiceState();
  const oneHours = state.hours.one || 8;
  const secondHours = state.hours.second || 8;
  const editOnly = !!state.editOnly;
  const hasEdits = (state.edits || []).length > 0;
  const canSubmit = editOnly ? (hasEdits || (state.secondSelected && state.status === 'available')) : (state.status === 'available' && state.selected === 'video-one');
  const disabledClass = state.status !== 'available' ? 'is-disabled' : '';
  const secondDisabledClass = state.status !== 'available' || state.selected !== 'video-one' ? 'is-disabled is-dependent-disabled' : '';
  const editCard = (key, label) => `<button type="button" class="video-edit-card ${(state.edits || []).includes(key) ? 'is-selected' : ''}" data-video-edit="${key}"><strong>${label}</strong><span>$${videoEditPrice(key, !!state.secondSelected)}</span></button>`;
  const ctx = packageUpgradeState();
  const hasSecondInPackage = /second videographer/i.test(ctx.packageText);
  const dateSection = `<section class="booth-date-check"><div class="booth-date-row"><label><span>Event date</span><button type="button" class="booth-date-display" data-video-calendar-toggle>${formatVideoDate(state.date) || 'Select event date'}</button><input type="hidden" data-video-date value="${state.date || ''}"></label><button type="button" class="blue-btn booth-check-btn" data-video-check ${state.date ? '' : 'disabled'}>check availability</button></div>${renderVideoCalendar(state.date, state.calendarOpen !== false)}${videoAvailabilityStatusHtml(state)}</section>`;
  const secondCard = `<div class="upgrade-choice-card content-choice video-choice ${disabledClass} ${secondDisabledClass} ${state.secondSelected ? 'is-selected' : ''}" data-video-choice="video-second"><strong>Second Videographer</strong>${videoPriceHtml('second', secondHours)}<ul><li>${secondHours} hours</li><li>Raw video footage</li><li>Digital download of high resolution video</li></ul><div class="book-qty content-hours"><button type="button" data-video-hours-minus="second">−</button><em>${secondHours} hrs</em><button type="button" data-video-hours-plus="second">+</button></div></div>`;
  const coverageSection = editOnly ? (hasSecondInPackage ? '' : `<div class="upgrade-choice-grid video-choice-grid video-choice-grid-edit-only">${secondCard}</div>`) : `<div class="upgrade-choice-grid video-choice-grid"><div class="upgrade-choice-card content-choice video-choice ${disabledClass} ${state.selected === 'video-one' ? 'is-selected' : ''}" data-video-choice="video-one"><strong>One Videographer</strong>${videoPriceHtml('one', oneHours)}<ul><li>${oneHours} hours</li><li>Raw video footage</li><li>Digital download of high resolution video</li></ul><div class="book-qty content-hours"><button type="button" data-video-hours-minus="one">−</button><em>${oneHours} hrs</em><button type="button" data-video-hours-plus="one">+</button></div></div>${secondCard}</div>`;
  popup.innerHTML = `<h4>${editOnly ? 'Edit Your Video / Add Second Videographer' : 'Choose Videography'}</h4>${editOnly ? '' : dateSection}${coverageSection ? `${editOnly ? dateSection : ''}${coverageSection}` : ''}<section class="video-edit-options ${editOnly ? 'is-edit-only' : ''}"><h5>Video editing options</h5>${editOnly ? '<p class="video-edit-help">Editing options can be added without checking availability. Use the calendar only if you also want to add a second videographer.</p>' : ''}<div class="video-edit-grid">${editCard('cinematography','Cinematography')}${editCard('trailer','Trailer')}${editCard('traditional','Traditional')}${editCard('extended','Extended trailer')}</div></section><button type="button" class="upgrade-choice-submit video-choice-submit" data-video-submit ${canSubmit ? '' : 'disabled'}>add to package</button><button type="button" class="upgrade-choice-cancel" data-upgrade-choice-close>cancel</button>`;
}
function setVideoDate(value) { const state = videoChoiceState(); window.__videoChoice = {...state, date:value, status:'idle', selected: state.editOnly ? 'video-one' : '', calendarMonth:value, calendarOpen:false}; renderVideoChoicePopup(); }
function shiftVideoCalendar(delta) { const state = videoChoiceState(); const {year, month} = videoCalendarState(state.date || ''); const next = new Date(year, month + delta, 1); window.__videoChoice = {...state, calendarMonth:`${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}-01`, calendarOpen:true}; renderVideoChoicePopup(); }
function checkVideoAvailability() { const state = videoChoiceState(); if (!state.date) return; window.__videoChoice = {...state, status:'checking', calendarOpen:false}; renderVideoChoicePopup(); setTimeout(() => { const current = videoChoiceState(); window.__videoChoice = {...current, status:'available'}; renderVideoChoicePopup(); }, 1800); }
function changeVideoHours(type, delta) { const state = videoChoiceState(); const key = type === 'second' ? 'second' : 'one'; const hours = Math.max(6, (state.hours[key] || 8) + delta); window.__videoChoice = {...state, hours:{...state.hours, [key]:hours}}; renderVideoChoicePopup(); }
function selectVideoChoice(key) { const state = videoChoiceState(); if (state.status !== 'available') return; if (key === 'video-second') { if (state.selected !== 'video-one') return; window.__videoChoice = {...state, secondSelected: !state.secondSelected}; } else { window.__videoChoice = {...state, selected:'video-one'}; } renderVideoChoicePopup(); }
function toggleVideoEdit(key) {
  const state = videoChoiceState();
  let edits = [...(state.edits || [])];
  if (edits.includes(key)) edits = edits.filter(item => item !== key);
  else if (key === 'cinematography') edits = ['cinematography'];
  else if (key === 'traditional') edits = ['traditional', ...edits.filter(item => item === 'trailer' || item === 'extended').slice(0,1)];
  else if (key === 'trailer') edits = edits.includes('traditional') ? ['traditional', 'trailer'] : ['trailer'];
  else if (key === 'extended') edits = edits.includes('traditional') ? ['traditional', 'extended'] : ['extended'];
  window.__videoChoice = {...state, edits};
  renderVideoChoicePopup();
}
function submitVideoChoice() { const state = videoChoiceState(); const hasEdits = (state.edits || []).length > 0; if (state.editOnly) { if (!hasEdits && !state.secondSelected) return; if (state.secondSelected && state.status !== 'available') return; if (state.secondSelected && !document.querySelector('[data-upgrade-line="video-second"]') && !/second videographer/i.test(packageUpgradeState().packageText)) addPackageUpgrade('video-second', 1, {keepChoiceOpen:true}); if (hasEdits) addPackageUpgrade('video-editing'); else closeUpgradeChoice(), updatePackageBalance(), syncHomeGridHeight(); } else { if (state.status !== 'available' || state.selected !== 'video-one') return; addPackageUpgrade('video-one', 1, {keepChoiceOpen:true}); if (state.secondSelected) addPackageUpgrade('video-second', 1, {keepChoiceOpen:true}); if (hasEdits) addPackageUpgrade('video-editing'); else closeUpgradeChoice(), updatePackageBalance(), syncHomeGridHeight(); } window.__videoChoice = {date: state.date || '', status:'idle', selected:'', secondSelected:false, editOnly:false, hours:state.hours, edits:state.edits, calendarMonth:state.calendarMonth || '', calendarOpen:false}; }
function syncPhotoBookChoicePopup() {
  const choices = window.__photoBookChoice || {};
  document.querySelectorAll('[data-book-choice]').forEach(card => {
    const qty = choices[card.dataset.bookChoice] || 0;
    card.classList.toggle('is-selected', qty > 0);
    const qtyLabel = card.querySelector(`[data-book-qty="${card.dataset.bookChoice}"]`);
    if (qtyLabel) qtyLabel.textContent = String(qty || 0);
  });
  const submit = document.querySelector('[data-photo-book-submit]');
  if (submit) submit.disabled = !Object.values(choices).some(Number);
}
function changePhotoBookChoice(key, delta) {
  window.__photoBookChoice = window.__photoBookChoice || {};
  const current = window.__photoBookChoice[key] || 0;
  const next = Math.max(0, current + delta);
  if (next) window.__photoBookChoice[key] = next;
  else delete window.__photoBookChoice[key];
  syncPhotoBookChoicePopup();
}
function togglePhotoBookChoice(key) {
  window.__photoBookChoice = window.__photoBookChoice || {};
  if (window.__photoBookChoice[key] > 0) {
    delete window.__photoBookChoice[key];
  } else {
    window.__photoBookChoice[key] = 1;
  }
  syncPhotoBookChoicePopup();
}
function submitPhotoBookChoices() {
  const choices = window.__photoBookChoice || {};
  Object.entries(choices).forEach(([key, qty]) => {
    if (qty > 0) addPackageUpgrade(key, qty, {keepChoiceOpen: true});
  });
  window.__photoBookChoice = {};
  closeUpgradeChoice();
  updatePackageBalance();
  syncHomeGridHeight();
}
function closeUpgradeChoice() {
  const popup = document.querySelector('.upgrade-choice-popup');
  if (!popup) return;
  popup.hidden = true;
  popup.innerHTML = '';
}
function syncPackageUpgradeQuantityLabel(titleLine) {
  if (!titleLine) return;
  const quantity = Number(titleLine.dataset.quantity || 1);
  let badge = titleLine.querySelector('.package-line-quantity');
  if (quantity > 1) {
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'package-line-quantity';
      titleLine.querySelector('.package-upgrade-name')?.after(badge);
    }
    badge.textContent = `×${quantity}`;
  } else {
    badge?.remove();
  }
}
function addPackageUpgrade(upgrade, quantity = 1, options = {}) {
  const now = Date.now();
  if (!options.keepChoiceOpen && window.__lastUpgradeAdd?.key === upgrade && now - window.__lastUpgradeAdd.time < 500) return;
  window.__lastUpgradeAdd = {key: upgrade, time: now};
  const ctx = packageUpgradeState();
  const defs = upgradeDefinitions(ctx);
  const def = defs[upgrade];
  const list = document.querySelector('.package-list');
  if (!list || !def) return;
  notifyUpgradeRequest(def, upgrade, quantity);
  if (upgrade === 'premium-photo') {
    document.querySelectorAll('[data-upgrade-line="sneak-peek"]').forEach(line => line.remove());
    const sneakCard = document.querySelector('[data-upgrade="sneak-peek"]');
    const sneakButton = document.querySelector('[data-upgrade-add="sneak-peek"]');
    if (sneakCard) {
      sneakCard.hidden = false;
      sneakCard.classList.remove('is-added', 'is-included', 'is-option-hidden');
    }
    if (sneakButton) sneakButton.textContent = 'add to package';
  }
  if (upgrade === 'sneak-peek' && document.querySelector('[data-upgrade-line="premium-photo"]')) return;
  let titleLine = document.querySelector(`.package-list .package-upgrade-title[data-upgrade-line="${upgrade}"]`);
  if (titleLine && def.album) {
    titleLine.dataset.quantity = String(Number(titleLine.dataset.quantity || 1) + Number(quantity || 1));
    syncPackageUpgradeQuantityLabel(titleLine);
    titleLine.querySelector('.package-line-price')?.replaceChildren(document.createTextNode(formatMoney((def.price || 0) * Number(titleLine.dataset.quantity || 1))));
  } else if (!titleLine) {
    const addedAt = Date.now();
    const qtyControls = '';
    const initialQuantity = Number(quantity || 1);
    const initialHours = Number((def.title || '').match(/, (\d+) hours/)?.[1] || 0);
    const hourAttrs = initialHours ? ` data-hours="${initialHours}"` : '';
    const quantityBadge = def.album && initialQuantity > 1 ? `<span class="package-line-quantity">×${initialQuantity}</span>` : '';
    const tempLine = {dataset:{upgradeLine: upgrade, quantity: String(initialQuantity), hours: String(initialHours || '')}};
    const title = `<li class="package-upgrade-title" data-upgrade-line="${upgrade}" data-added-at="${addedAt}" data-quantity="${initialQuantity}" data-min-quantity="${initialQuantity}"${!state.isAdmin ? ' data-client-upgrade="1"' : ''}${hourAttrs}${initialHours ? ` data-min-hours="${initialHours}"` : ''}><span class="package-upgrade-name">${upgradeLineTitle(upgrade, def.title)}</span>${quantityBadge}${upgradeLineControl(upgrade, initialHours)}${qtyControls} <button type="button" class="remove-upgrade" data-upgrade-remove="${upgrade}">remove</button><strong class="package-line-price">${formatMoney(packageUpgradeLinePrice(tempLine, defs))}</strong></li>`;
    const items = def.items.map(item => `<li class="package-upgrade-line" data-upgrade-line="${upgrade}">${item}</li>`).join('');
    const inlineNotice = def.inlineNotice ? `<li class="package-upgrade-notice" data-upgrade-line="${upgrade}">${def.notice}</li>` : '';
    list.insertAdjacentHTML('beforeend', title + items + inlineNotice);
  }
  if (def.availability && !def.inlineNotice) showUpgradeNotice(def.notice);
  if (def.email) console.info('Prototype email request queued for studio:', def.title);
  const card = document.querySelector(`[data-upgrade="${upgrade}"]`);
  card?.classList.add('is-added');
  card?.setAttribute('hidden', '');
  const button = document.querySelector(`[data-upgrade-add="${upgrade}"]`);
  if (button && !button.classList.contains('add-album')) button.textContent = 'added';
  refreshPackageUpgradePrices();
  if (!options.keepChoiceOpen) closeUpgradeChoice();
  if (!options.keepChoiceOpen) updatePackageBalance();
  if (!options.keepChoiceOpen) syncHomeGridHeight();
}
function removePackageUpgrade(upgrade) {
  document.querySelectorAll(`[data-upgrade-line="${upgrade}"]`).forEach(line => line.remove());
  if (upgrade === 'video-one') {
    document.querySelectorAll('[data-upgrade-line="video-second"], [data-upgrade-line="video-editing"], [data-upgrade-line="premium-video"]').forEach(line => line.remove());
  }
  if (upgrade === 'video-second' && !document.querySelector('[data-upgrade-line="video-one"]')) {
    document.querySelectorAll('[data-upgrade-line="video-editing"], [data-upgrade-line="premium-video"]').forEach(line => line.remove());
  }
  if (upgrade === 'premium-video') {
    document.querySelectorAll('[data-upgrade-line="video-one"], [data-upgrade-line="video-second"], [data-upgrade-line="video-editing"]').forEach(line => line.remove());
  }
  document.querySelectorAll('.package-list > li').forEach(line => {
    const text = (line.textContent || '').trim().toLowerCase();
    if (!line.dataset.upgradeLine && !document.querySelector('[data-upgrade-line="video-one"]') && !document.querySelector('[data-upgrade-line="video-second"]') && /^trailer$/.test(text)) line.remove();
  });
  document.querySelectorAll('.upgrade-card').forEach(card => {
    card.hidden = false;
    card.classList.remove('is-added', 'is-included', 'is-option-hidden');
  });
  document.querySelectorAll('[data-upgrade-add]').forEach(button => {
    if (!button.classList.contains('add-album')) button.textContent = /availability/.test(button.dataset.upgradeAdd || '') ? 'check availability' : 'add to package';
  });
  refreshPackageUpgradePrices();
  updatePackageBalance();
  syncHomeGridHeight();
}
function syncTileUpgradeActions(ctx = packageUpgradeState()) {
  document.querySelectorAll('[data-card-upgrade-choice]').forEach(btn => btn.remove());
  const addPlus = (selector, choice, active) => {
    const card = document.querySelector(selector);
    if (!card || !active) return;
    card.insertAdjacentHTML('beforeend', `<button type="button" class="tile-plus-action" data-card-upgrade-choice="${choice}" aria-label="Add package option">+</button>`);
  };
  addPlus('.tile-video-details', 'video-editing-only', ctx.hasVideography);
  addPlus('.tile-photo-booth', 'photo-booth', ctx.hasPhotoBooth);
  addPlus('.tile-content-creation', 'content-creation', ctx.hasContentCreation);
  const bookTitle = document.querySelector('.tile-book h3')?.textContent.toLowerCase() || '';
  if (bookTitle.includes('photography')) addPlus('.tile-book', 'photography', ctx.hasPhotography);
  else addPlus('.tile-book', 'photo-book', ctx.hasPhotoBook);
}
function syncClientPackageMinimumControls() {
  document.querySelectorAll('.package-base-title, .package-upgrade-title').forEach(line => {
    const current = Number(line.dataset.hours || line.dataset.qty || line.dataset.quantity || 0);
    const min = Number(line.dataset.minHours || line.dataset.minQty || line.dataset.minQuantity || current);
    line.querySelectorAll('[data-delta="-1"]').forEach(button => {
      const locked = !state.isAdmin && current <= min;
      button.disabled = locked;
      button.classList.toggle('is-locked-min', locked);
    });
  });
}
function syncHomeGridHeight() {
  const grid = document.querySelector('.event-dashboard-grid');
  const left = document.querySelector('.event-left-column');
  const right = document.querySelector('.event-right-grid');
  if (!grid || !left || !right) return;
  grid.style.removeProperty('--event-grid-height');
  const ctx = packageUpgradeState();
  grid.classList.toggle('is-photo-only', ctx.isPhotoOnly);
  grid.classList.toggle('has-videography', ctx.hasVideography);
  grid.classList.toggle('has-photo-book', ctx.hasPhotoBook);
  grid.classList.toggle('has-photo-booth', ctx.hasPhotoBooth);
  grid.classList.toggle('has-content-creation', ctx.hasContentCreation);
  grid.classList.toggle('has-photo-upgrade', ctx.hasPhotoUpgrade);
  updateDynamicUpgradePrices();
  syncEditVideoAction();
  updatePackageBalance();
  syncPackageBuilderState(ctx);
  syncClientPackageMinimumControls();
  const bookCard = document.querySelector('[data-upgrade="photo-book"], [data-upgrade="photography"]');
  if (bookCard) {
    const title = bookCard.querySelector('h4');
    const list = bookCard.querySelector('ul');
    const btn = bookCard.querySelector('button');
    const shouldShowPhotographyTile = ctx.hasVideoBase && !packageHasBasePhotography(ctx);
    if (shouldShowPhotographyTile) {
      bookCard.dataset.upgrade = 'photography';
      if (title) title.innerHTML = 'Photography <span>$2599 / $2999</span>';
      if (list) list.innerHTML = '<li>Choose one photographer or add a second photographer</li><li>Includes edited images, gallery, downloads, and rights</li>';
      if (btn) { btn.dataset.upgradeChoice = 'photography'; btn.setAttribute('onclick', "event.preventDefault(); event.stopPropagation(); openUpgradeChoice('photography');"); btn.textContent = 'add to package'; }
    } else if (bookCard.dataset.upgrade === 'photography') {
      bookCard.dataset.upgrade = 'photo-book';
      if (title) title.innerHTML = 'Photo Book <span>$519 / $569</span>';
      if (list) list.innerHTML = '<li>Choose 10x10 or 12x12, 30 pages</li><li>DIY album design with our free software</li><li>Professional album design available for $100</li>';
      if (btn) { btn.dataset.upgradeChoice = 'photo-book'; btn.setAttribute('onclick', "event.preventDefault(); event.stopPropagation(); openUpgradeChoice('photo-book');"); btn.textContent = 'add to package'; }
    }
  }
  const bookTile = document.querySelector('.tile-book');
  if (bookTile) {
    const title = bookTile.querySelector('h3');
    const included = bookTile.querySelector('.included-copy');
    const addon = bookTile.querySelector('.addon-copy');
    const includedBtn = bookTile.querySelector('.included-action');
    const addonBtn = bookTile.querySelector('.addon-action');
    if (ctx.hasVideoBase && !packageHasBasePhotography(ctx)) {
      bookTile.classList.add('is-photography-tile');
      bookTile.classList.toggle('is-active-package-card', ctx.hasPhotography);
      if (title) title.innerHTML = 'Photography <span class="addon-badge">Optional add on</span>'; 
      if (included) included.textContent = 'Please complete the photography questions so our team knows exactly what to capture and deliver.';
      if (addon) addon.textContent = 'Photography is not included in your current package, but you can still add it anytime. We will check availability for your event date.';
      if (includedBtn) { const btnClone = includedBtn.cloneNode(true); btnClone.textContent = ctx.hasPhotography ? 'view' : 'add to package'; btnClone.removeAttribute('data-route'); btnClone.setAttribute('onclick', "event.preventDefault(); event.stopImmediatePropagation(); openUpgradeChoice('photography');"); includedBtn.replaceWith(btnClone); }
      if (addonBtn) { addonBtn.textContent = 'add to package'; addonBtn.setAttribute('onclick', "event.preventDefault(); event.stopImmediatePropagation(); openUpgradeChoice('photography');"); }
    } else {
      bookTile.classList.remove('is-photography-tile');
      bookTile.classList.toggle('is-active-package-card', ctx.hasPhotoBook);
      if (title) title.innerHTML = 'Photo Book <span class="addon-badge">Optional add on</span>';
      if (included) included.textContent = 'Use our DIY photo book software to design your album when you are ready.';
      if (addon) addon.textContent = 'Photo book is not included in your current package, but you can still add one anytime. Design it yourself with our DIY album software, or ask us about professional album design.';
      if (includedBtn) { includedBtn.textContent = 'create'; includedBtn.dataset.route = 'photobook'; includedBtn.removeAttribute('onclick'); }
      if (addonBtn) { addonBtn.textContent = 'add to package'; addonBtn.setAttribute('onclick', "event.preventDefault(); event.stopImmediatePropagation(); openUpgradeChoice('photo-book');"); }
    }
  }
  syncTileUpgradeActions(ctx);
  const optionOrder = [];
  const isEmptyPackage = !basePackageText() && !ctx.selected.size;
  const isBuildingBookedPackage = !builderState().done;
  const isVideoOnly = ctx.hasVideography && !ctx.hasPhotography;
  if (isEmptyPackage || isBuildingBookedPackage) {
    document.querySelectorAll('.upgrade-card').forEach(card => card.classList.add('is-option-hidden'));
    grid.classList.toggle('upgrades-empty', true);
    const naturalLeftHeight = Math.ceil(left.scrollHeight);
    const payCopy = document.querySelector('.tile-pay p');
    const payContentHeight = payCopy ? Math.ceil(payCopy.scrollHeight) : 0;
    const earlyPaymentGrowth = payContentHeight > 360 ? Math.ceil((payContentHeight - 360) * 2.45) : 0;
    const height = Math.max(naturalLeftHeight, 1617 + earlyPaymentGrowth);
    grid.style.setProperty('--event-grid-height', `${height}px`);
    return;
  }
  if (isVideoOnly) {
    if (packageHasRawVideoWithoutEditing(ctx)) optionOrder.push('video-editing');
    if (premiumVideoUpgrade(ctx) && !ctx.selected.has('premium-video')) optionOrder.push('premium-video');
    optionOrder.push('photography');
    if (!ctx.hasPhotoBooth) optionOrder.push('photo-booth');
    if (!ctx.hasContentCreation) optionOrder.push('content-creation');
  } else {
    if (!ctx.hasVideography) optionOrder.push('add-videography');
    if (ctx.hasPhotography && !ctx.selected.has('sneak-peek') && !ctx.selected.has('premium-photo')) optionOrder.push('sneak-peek');
    if (ctx.hasPhotography && !ctx.selected.has('premium-photo')) optionOrder.push('premium-photo');
    if (!ctx.hasPhotoBooth) optionOrder.push('photo-booth');
    if (!ctx.hasPhotography) optionOrder.push('photography');
    else if (!ctx.hasPhotoBook) optionOrder.push('photo-book');
    if (!ctx.hasContentCreation) optionOrder.push('content-creation');
    if (ctx.hasVideography && premiumVideoUpgrade(ctx) && !ctx.selected.has('premium-video')) optionOrder.push('premium-video');
  }
  const visibleOptions = optionOrder.filter((item, index, arr) => arr.indexOf(item) === index && !ctx.selected.has(item));
  const visibleLimitedOptions = visibleOptions.slice(0, 2);
  const upgradeSection = document.querySelector('.package-upgrades');
  visibleOptions.forEach(key => {
    const card = document.querySelector(`.upgrade-card[data-upgrade="${key}"]`);
    if (upgradeSection && card) upgradeSection.appendChild(card);
  });
  document.querySelectorAll('.upgrade-card').forEach(card => {
    card.classList.toggle('is-option-hidden', card.hidden || !visibleLimitedOptions.includes(card.dataset.upgrade));
  });
  grid.classList.toggle('upgrades-empty', visibleOptions.length === 0);
  const naturalLeftHeight = Math.ceil(left.scrollHeight);
  const payCopy = document.querySelector('.tile-pay p');
  const payContentHeight = payCopy ? Math.ceil(payCopy.scrollHeight) : 0;
  const earlyPaymentGrowth = payContentHeight > 360 ? Math.ceil((payContentHeight - 360) * 2.45) : 0;
  const height = Math.max(naturalLeftHeight, 1617 + earlyPaymentGrowth);
  grid.style.setProperty('--event-grid-height', `${height}px`);
}

function content(route) {
  if (route === 'payments') return payments();
  if (route === 'vendors') return vendors();
  if (route === 'timeline') return timeline();
  if (route === 'misc') return misc();
  if (route === 'faq') return faq();
  return `<article class="card" style="left:0;top:0;width:760px;height:260px;padding:50px"><h2>Contact us</h2><p>Call us at 718.971.9710</p></article>`;
}
function selectPaymentMethod(event, method) {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  state.paymentMethod = method;
  render();
}
function paymentMethodHead(method, label, logo = '') {
  const selected = state.paymentMethod === method;
  return `<button type="button" class="payment-method-head ${selected ? 'is-selected' : ''}" data-payment-method="${method}" onclick="selectPaymentMethod(null,'${method}')"><span class="pay-check ${selected ? '' : 'empty'}">${selected ? '✓' : ''}</span>${logo || `<strong>${label}</strong>`}</button>`;
}
function mastercardLogo() {
  return '<span class="cc-logo mc" aria-label="Mastercard"><svg viewBox="0 0 64 40" aria-hidden="true"><rect width="64" height="40" rx="4" fill="#fff"/><circle cx="26" cy="20" r="13" fill="#eb001b"/><circle cx="38" cy="20" r="13" fill="#f79e1b"/><path d="M32 9.8a13 13 0 0 1 0 20.4 13 13 0 0 1 0-20.4z" fill="#ff5f00"/></svg></span>';
}
function formatPaymentAmount(value) {
  const cleaned = String(value || '').replace(/[^0-9.]/g, '');
  if (!cleaned) return '';
  return `$${cleaned}`;
}
const paymentStates = ['State','AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'];
const paymentCountries = ['Country','United States','United Kingdom','Canada','Australia','Afghanistan','Albania','Algeria','Argentina','Armenia','Austria','Bahamas','Bangladesh','Belgium','Brazil','Bulgaria','Chile','China','Colombia','Costa Rica','Croatia','Czech Republic','Denmark','Dominican Republic','Ecuador','Egypt','France','Georgia','Germany','Greece','Guatemala','Haiti','Honduras','Hong Kong','Hungary','India','Indonesia','Ireland','Israel','Italy','Jamaica','Japan','Kazakhstan','Mexico','Moldova','Montenegro','Netherlands','New Zealand','Nigeria','North Macedonia','Norway','Pakistan','Peru','Philippines','Poland','Portugal','Romania','Russia','Serbia','Singapore','Slovakia','Slovenia','South Africa','South Korea','Spain','Sweden','Switzerland','Taiwan','Thailand','Turkey','Ukraine','United Arab Emirates','Uruguay','Venezuela','Vietnam'];
function optionList(items) { return items.map(item => `<option>${item}</option>`).join(''); }
function paymentLookupField(placeholder, items, cls = '') {
  const values = items.filter(item => item !== 'State' && item !== 'Country' && item !== 'Month' && item !== 'Year');
  return `<label class="payment-lookup ${cls}"><input class="payment-search-field" placeholder="${placeholder}" data-payment-lookup autocomplete="off"><div class="payment-lookup-menu">${values.map(item => `<button type="button" data-payment-lookup-choice="${item}">${item}</button>`).join('')}</div></label>`;
}
function paymentSubmitButton() {
  if (state.paymentMethod === 'zelle') return '';
  const label = state.paymentMethod === 'paypal' ? 'CONTINUE TO PAYPAL' : 'MAKE A PAYMENT';
  return `<button class="payment-submit">${label}</button>`;
}
function payments() {
  return `<style id="payment-critical-css">
.screen-payments .payment-top-bar{position:absolute!important;left:0!important;top:0!important;width:2549px!important;height:68px!important;background:#0785c4!important;z-index:40!important;display:block!important;pointer-events:none!important;}
.screen-payments .dashboard-page .page-heading{display:block!important;left:102px!important;top:18px!important;z-index:90!important;color:#fff!important;font-size:24px!important;font-weight:500!important;line-height:32px!important;margin:0!important;}
.screen-payments .dashboard-page .page-heading:before{content:""!important;position:absolute!important;left:-34px!important;top:-14px!important;width:1px!important;height:68px!important;background:rgba(255,255,255,.24)!important;}
.screen-payments .dashboard-page .menu-toggle{display:flex!important;flex-direction:column!important;justify-content:center!important;gap:6px!important;left:0!important;top:0!important;width:76px!important;height:68px!important;z-index:801!important;background:transparent!important;pointer-events:auto!important;cursor:pointer!important;padding:0 0 0 24px!important;box-sizing:border-box!important;}
.screen-payments .dashboard-page .menu-toggle span{display:block!important;width:28px!important;height:3px!important;margin:0!important;background:#fff!important;border-radius:2px!important;pointer-events:none!important;}
.screen-payments .dashboard-page .menu-click-zone{display:block!important;left:0!important;top:0!important;width:95px!important;height:78px!important;z-index:800!important;border:0!important;background:transparent!important;cursor:pointer!important;pointer-events:auto!important;}
.screen-payments .dashboard-page .side.home-left{display:block!important;left:-280px!important;top:0!important;width:280px!important;height:1340px!important;padding:0!important;background:#fff!important;color:#333!important;border-right:1px solid #e8eef2!important;box-shadow:none!important;z-index:180!important;pointer-events:auto!important;transition:left .2s ease!important;}
.screen-payments .dashboard-page.menu-open .side.home-left{display:block!important;left:0!important;}
.screen-payments .dashboard-page .side.home-left::before{content:""!important;position:absolute!important;left:0!important;top:0!important;width:280px!important;height:68px!important;background:linear-gradient(135deg,#a9c9e1 0%,#a9c9e1 46%,#c8dce9 47%,#c8dce9 100%)!important;z-index:0!important;}
.screen-payments .dashboard-page .side.home-left::after{display:none!important;}
.screen-payments .dashboard-page .side.home-left .sidebar-brand{position:relative!important;z-index:1!important;height:68px!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;}
.screen-payments .dashboard-page .side.home-left .sidebar-brand .logo-box{display:none!important;}
.screen-payments .dashboard-page .side.home-left .sidebar-menu,.screen-payments .dashboard-page .side.home-left .sidebar-bottom{position:relative!important;z-index:1!important;width:100%!important;}
.screen-payments .dashboard-page .side.home-left .sidebar-section{border-bottom:14px solid #fff!important;}
.screen-payments .dashboard-page .side.home-left .sidebar-section-title{height:46px!important;display:flex!important;align-items:center!important;padding:0 31px!important;background:#f4f4f4!important;color:#aeb8c1!important;font-size:12px!important;line-height:1!important;letter-spacing:.16em!important;text-transform:uppercase!important;font-weight:700!important;}
.screen-payments .dashboard-page .side.home-left .sidebar-menu button,.screen-payments .dashboard-page .side.home-left .sidebar-bottom button{width:100%!important;height:44px!important;border:0!important;background:#fff!important;color:#60727f!important;display:flex!important;align-items:center!important;gap:16px!important;padding:0 31px!important;text-align:left!important;font-size:14px!important;font-weight:400!important;text-transform:none!important;letter-spacing:0!important;}
.screen-payments .dashboard-page .side.home-left .sidebar-menu button:hover,.screen-payments .dashboard-page .side.home-left .sidebar-bottom button:hover{background:#fbfdff!important;color:#0428a4!important;}
.screen-payments .dashboard-page .side.home-left .sidebar-icon{color:#0428a4!important;font-size:13px!important;width:16px!important;flex:0 0 16px!important;opacity:.9!important;display:inline-flex!important;justify-content:center!important;line-height:1!important;}
.screen-payments .dashboard-page .side.home-left .sidebar-bottom{position:absolute!important;left:0!important;bottom:0!important;border-top:1px solid #eef2f5!important;background:#fff!important;}
.screen-payments .dashboard-page .side.home-left .sidebar-bottom button{height:46px!important;border-top:1px solid #eef2f5!important;}
.screen-payments .payment-left-menu{display:none!important;}
.screen-payments .payment-page{left:465px!important;top:108px!important;width:1240px!important;height:1150px!important;transform:scale(1.16)!important;transform-origin:top left!important;}
.screen-payments .payment-main-title{left:55px!important;top:0!important;font-size:30px!important;}
.screen-payments .payment-history-card{left:55px!important;top:84px!important;width:410px!important;min-height:560px!important;padding:32px 30px 0!important;}
.screen-payments .payment-history-card h3{font-size:19px!important;}
.screen-payments .payment-history-card p{font-size:15px!important;width:330px!important;}
.screen-payments .payment-history-table{margin-top:62px!important;font-size:14px!important;}
.screen-payments .payment-history-table th{font-size:12px!important;color:#0428a4!important;}
.screen-payments .payment-history-table thead{border-bottom:1px solid #d9e3ea!important;}
.screen-payments .payment-history-table tbody tr:first-child td{padding-top:16px!important;}
.screen-payments .payment-history-method-tag{display:inline-flex!important;align-items:center!important;min-height:18px!important;padding:2px 6px!important;border-radius:4px!important;background:#e3f7e9!important;border:1px solid rgba(39,154,83,.22)!important;color:#23834d!important;font-size:9px!important;line-height:1!important;font-style:normal!important;font-weight:700!important;text-transform:uppercase!important;letter-spacing:.025em!important;white-space:nowrap!important;}
.screen-payments .payment-history-balance strong{font-size:18px!important;}
.screen-payments .payment-history-total strong{font-size:15px!important;}
.screen-payments .payment-checkout{left:540px!important;top:84px!important;width:750px!important;}
.screen-payments .payment-amount-input,.screen-payments .payment-method-card{width:750px!important;}
.screen-payments .payment-method-card{min-height:0!important;}
.screen-payments .payment-method-section{margin-top:44px!important;}
.screen-payments .payment-method-head{width:100%!important;border-left:0!important;border-right:0!important;border-bottom:0!important;background:#fff!important;text-align:left!important;cursor:pointer!important;font-family:inherit!important;}
.screen-payments .payment-method-head.is-selected{background:#f4f8fb!important;}
.screen-payments .payment-method-head strong{color:#111!important;}
.screen-payments .payment-method-card,.screen-payments .payment-amount-input,.screen-payments .payment-history-card{border-color:#8bb4d4!important;}
.screen-payments .pay-check{background:#0428a4!important;}
.screen-payments .credit-card-fields{padding:30px 32px 34px!important;gap:28px 30px!important;position:relative!important;z-index:2!important;}
.screen-payments .payment-amount-input input{font-size:15px!important;}
.screen-payments .credit-card-fields select,.screen-payments .credit-card-fields input{position:relative!important;z-index:3!important;pointer-events:auto!important;color:#263b55!important;font-size:14px!important;opacity:1!important;}
.screen-payments .credit-card-fields input{border:0!important;border-bottom:1px solid #ddd!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;padding:0!important;}
.screen-payments .credit-card-fields select{height:34px!important;border:0!important;border-bottom:1px solid #ddd!important;border-radius:0!important;background-color:transparent!important;padding:0 24px 0 0!important;color:#263b55!important;background-image:linear-gradient(45deg, transparent 50%, #0785c4 50%),linear-gradient(135deg, #0785c4 50%, transparent 50%)!important;background-position:calc(100% - 13px) 14px,calc(100% - 8px) 14px!important;background-size:5px 5px,5px 5px!important;background-repeat:no-repeat!important;appearance:none!important;box-shadow:none!important;}
.screen-payments .credit-card-fields .payment-search-field{height:34px!important;border:0!important;border-bottom:1px solid #ddd!important;border-radius:0!important;background:transparent!important;padding:0 22px 0 0!important;box-shadow:none!important;}
.screen-payments .payment-lookup{position:relative!important;}
.screen-payments .payment-lookup::after{display:none!important;}
.screen-payments .payment-lookup-menu{display:none!important;position:absolute!important;left:0!important;top:38px!important;width:100%!important;max-height:168px!important;overflow:auto!important;background:#fff!important;border:1px solid #c8dce9!important;box-shadow:0 10px 22px rgba(38,59,85,.12)!important;z-index:50!important;box-sizing:border-box!important;}
.screen-payments .payment-lookup:focus-within .payment-lookup-menu{display:block!important;}
.screen-payments .payment-lookup-menu button{display:block!important;width:100%!important;height:30px!important;padding:0 10px!important;border:0!important;background:#fff!important;color:#263b55!important;font-size:13px!important;text-align:left!important;cursor:pointer!important;}
.screen-payments .payment-lookup-menu button:hover{background:#eef7fd!important;color:#0428a4!important;}
.screen-payments .payment-lookup-menu button.is-hidden{display:none!important;}
.screen-payments .credit-card-fields select:focus,.screen-payments .credit-card-fields input:focus{outline:0!important;border-color:#0785c4!important;box-shadow:none!important;}
.screen-payments .payment-option-note{padding:30px 28px!important;color:#263b55!important;font-size:16px!important;line-height:1.45!important;background:#fff!important;border-top:1px solid #d9e3ea!important;}
.screen-payments .payment-option-note strong{display:block!important;margin-bottom:8px!important;color:#263b55!important;font-size:18px!important;}
.screen-payments .paypal-logo,.screen-payments .payment-method-head strong,.screen-payments .payment-method-head strong.zelle-logo{font-size:22px!important;line-height:1!important;}
.screen-payments .cc-logo{width:44px!important;height:26px!important;font-size:10px!important;}
.screen-payments .cc-logo.mc{width:48px!important;height:30px!important;border:0!important;box-shadow:none!important;background:transparent!important;padding:0!important;}
.screen-payments .cc-logo.mc svg{display:block!important;width:48px!important;height:30px!important;}
.screen-payments .payment-card-action{grid-column:1 / -1!important;display:flex!important;justify-content:flex-end!important;margin-top:8px!important;}
.screen-payments .payment-submit{display:block!important;float:none!important;margin:0!important;width:320px!important;height:48px!important;background:#0428a4!important;color:#fff!important;border:0!important;font-size:14px!important;font-weight:700!important;letter-spacing:1.2px!important;text-align:center!important;}
.screen-payments .paypal-note{display:flex!important;flex-direction:column!important;align-items:flex-end!important;}
.screen-payments .paypal-note strong,.screen-payments .paypal-note p{align-self:stretch!important;}
.screen-payments .paypal-note .payment-submit{margin-top:22px!important;width:320px!important;height:48px!important;font-size:14px!important;}
</style><div class="payment-top-bar" aria-hidden="true" style="position:absolute;left:0;top:0;width:2549px;height:68px;background:#0785c4;z-index:40;display:block;pointer-events:none;"></div><aside class="abs home-left payment-left-menu"><div class="sidebar-brand"><div class="logo-box">LI</div></div><nav class="sidebar-menu"><div class="sidebar-section"><div class="sidebar-section-title">Event Info</div><button data-route="home"><span class="sidebar-icon">◼</span><span>Event details</span></button><button data-route="vendors"><span class="sidebar-icon">◎</span><span>Event vendors</span></button><button data-route="timeline"><span class="sidebar-icon">◷</span><span>Event Timeline</span></button><button data-route="home"><span class="sidebar-icon">◉</span><span>Video details</span></button><button data-route="misc"><span class="sidebar-icon">✣</span><span>Miscellaneous</span></button></div><div class="sidebar-section"><div class="sidebar-section-title">Photo Book</div><button data-route="home"><span class="sidebar-icon">▣</span><span>Create your album</span></button></div><div class="sidebar-section"><div class="sidebar-section-title">Photo Booth</div><button data-route="home"><span class="sidebar-icon">◈</span><span>Create your monogram</span></button></div><div class="sidebar-section"><div class="sidebar-section-title">QR Code</div><button data-route="home"><span class="sidebar-icon">▦</span><span>Create your QR Code</span></button></div><div class="sidebar-section"><div class="sidebar-section-title">Payments</div><button data-route="payments"><span class="sidebar-icon">▭</span><span>Billing</span></button></div></nav><nav class="sidebar-bottom"><button data-route="faq"><span class="sidebar-icon">●</span><span>FAQ</span></button><button data-route="contact"><span class="sidebar-icon">✉</span><span>Contact us</span></button><button data-route="home"><span class="sidebar-icon">⚙</span><span>Your settings</span></button></nav></aside><section class="payment-page">
    <h2 class="payment-main-title">Make a payment</h2>
    <article class="payment-history-card">
      <h3>Payment history</h3>
      <p>Here you can find your previous payments, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore.</p>
      <table class="payment-history-table"><thead><tr><th>DATE</th><th>METHOD</th><th>AMOUNT</th></tr></thead><tbody><tr><td>Sep 16, 2016</td><td><span class="payment-history-method-tag">Check</span></td><td>$1,000.00</td></tr><tr><td>Dec 22, 2016</td><td><span class="payment-history-method-tag">Zelle</span></td><td>$500.00</td></tr><tr><td>Dec 23, 2016</td><td><span class="payment-history-method-tag">Credit card</span></td><td>$500.00</td></tr><tr><td>Jan 04, 2017</td><td><span class="payment-history-method-tag">Cash</span></td><td>$860.00</td></tr></tbody></table>
      <div class="payment-history-balance"><span>Outstanding balance</span><strong>$860,00</strong><em>Due September 18</em></div>
      <div class="payment-history-total"><span>TOTAL</span><strong>$2,860,00</strong></div>
    </article>
    <section class="payment-checkout">
      <div class="payment-amount-section">
        <h3>Choose your payment amount</h3>
        <label class="payment-amount-input"><span>Enter payment amount here</span><input data-payment-amount value="${state.paymentAmount}" placeholder="$50.00" inputmode="decimal"></label>
      </div>
      <div class="payment-method-section">
        <h3>Choose your payment method</h3>
        <p>All transactions are secure and encrypted.</p>
        <article class="payment-method-card">
          ${paymentMethodHead('credit-card', 'Credit card', `<strong>Credit card</strong><span class="card-icons"><span class="cc-logo visa">VISA</span>${mastercardLogo()}<span class="cc-logo amex">AMEX</span><span class="cc-logo discover">DISC</span></span>`)}
          ${state.paymentMethod === 'credit-card' ? `<div class="credit-card-fields">
            <label><input placeholder="First name"></label><label><input placeholder="Last name"></label>
            <label class="pay-field-wide"><input placeholder="Credit card number"></label>
            ${paymentLookupField('Month', ['Month','01','02','03','04','05','06','07','08','09','10','11','12'], 'pay-field-third')}${paymentLookupField('Year', ['Year','2026','2027','2028','2029','2030','2031','2032','2033','2034','2035','2036'], 'pay-field-third')}<label class="pay-field-third"><input placeholder="CVV"></label>
            <label><input placeholder="Address 1"></label><label><input placeholder="Address 2"></label>
            <label><input placeholder="City"></label>${paymentLookupField('State', paymentStates)}
            <label><input placeholder="Zip code"></label>${paymentLookupField('Country', paymentCountries)}
            <div class="payment-card-action">${paymentSubmitButton()}</div>
          </div>` : ''}
          ${paymentMethodHead('paypal', 'PayPal', '<strong class="paypal-logo"><span>Pay</span><b>Pal</b></strong>')}
          ${state.paymentMethod === 'paypal' ? `<div class="payment-option-note paypal-note"><strong>PayPal selected</strong><p>Continue with PayPal to complete your payment securely. After the payment is processed, your balance will be updated.</p>${paymentSubmitButton()}</div>` : ''}
          ${paymentMethodHead('zelle', 'Zelle', '<strong class="zelle-logo">Zelle<span>®</span></strong>')}
          ${state.paymentMethod === 'zelle' ? '<div class="payment-option-note zelle-note"><strong>Zelle payment</strong><p>Please send your payment to nikola@leimageinc.com through Zelle. Once we receive it, we will update your payment history and balance.</p></div>' : ''}
        </article>
      </div>
    </section>
  </section>`;
}
function field(label, cls='', value='') { return `<label class="${cls}"><span class="field-label">${label}</span><input class="input" value="${value}"></label>`; }

function vendors() {
  return `<article class="card vendor-info"><h2>Your vendors</h2><p>Coordinating with all parties involved helps us to provide you with the best photos/video possible, please take a moment to fill out the contact info for the following vendors.</p><button class="blue-btn vendor-submit">SUBMIT VENDORS LIST</button></article><section class="abs vendor-list">${state.vendors.map(v => `<article class="vendor-card"><h3>${v[0]}</h3><div class="vendor-fields">${field('Name','',v[1])}${field('Website','',v[2])}${field('Email','',v[3])}</div></article>`).join('')}</section>`;
}
function miscChoice(label) { return `<label class="misc-choice"><input type="checkbox"><span>${label}</span></label>`; }
function miscRadio(name, label) { return `<label class="misc-choice"><input type="radio" name="${name}"><span>${label}</span></label>`; }
function miscInput(label, placeholder = '', cls = '') { return `<label class="misc-input ${cls}"><span>${label}</span><input placeholder="${placeholder}"></label>`; }
function miscTextarea(label, placeholder = '', cls = '') { return `<label class="misc-input ${cls}"><span>${label}</span><textarea placeholder="${placeholder}"></textarea></label>`; }
function miscSection(title, body) { return `<article class="misc-section"><h3>${title}</h3><div class="misc-section-body">${body}</div></article>`; }
function misc() {
  const vendorFields = [
    ['Wedding Venue Contact', "If you haven't provided this information already, please list the name, email, and phone number for your wedding venue contact."],
    ['Photographer', 'Please list the company name, contact person, and/or website.'],
    ['Videographer', 'Please list the company name, contact person, and/or website.'],
    ['DJ or Band', 'Please list the company name, contact person, and/or website.'],
    ['Officiant', 'Please list the company name, contact person, and/or website.'],
    ['Hair & Makeup', 'Please list the company name, contact person, and/or website.'],
    ['Florist', 'Please list the company name, contact person, and/or website.'],
    ['Cake', 'Please list the company name, contact person, and/or website.']
  ];
  return `<h2 class="abs misc-main-title">Miscellaneous</h2><article class="card misc-info"><h2>Miscellaneous info</h2><p>Please review these event notes and confirmations so our team has the information needed before the wedding day.</p></article><section class="abs misc-form-list">
    ${miscSection('Vendor Meal', `<p>Your photographer and videographer begin preparing for your wedding early and are on their feet throughout the day.</p><p>We ask that couples provide a vendor meal and allow the team at least a 20 minute break to eat and rest. Venues often serve vendors after all guests have been served, but that can delay the team from eating and preparing for the next event.</p><p>Please request that our team is served <strong>at the same time as guests</strong> so they have enough time to rest, use the restroom, eat, and prepare for the next timeline event.</p><div class="misc-choice-row">${miscRadio('vendor-meal','Sure, we will provide a vendor meal')}${miscRadio('vendor-meal','No, I need more information')}</div>`)}
    ${miscSection('Gratuity / Tip', `<p>We keep our package prices competitive and do not include gratuity in the package total. Any tip you feel is deserved is greatly appreciated. Please tip your photographer and videographer directly in separate payments, or add the tip to your final balance.</p>${miscChoice('I understand')}`)}
    ${miscSection('Add Gratuity to Final Balance', `<p>Would you like to add a tip to the final balance? A 10 to 20 percent gratuity is industry standard.</p><div class="misc-choice-row">${miscRadio('tip-balance','Yes')}${miscRadio('tip-balance','No')}</div>`)}
    ${miscSection('Family Photos', `<p>You provided a family shot list for required group photos during your wedding. Please choose a point person who knows the family and can help gather everyone for these photos. Please also give a copy of the shot list to that point person.</p><p>Our team is not familiar with every family member, so photos not listed on the family shot list may not be taken unless requested by the couple that day.</p>${miscChoice('I understand')}${miscInput('Point Person Name','Full name')}`)}
    ${miscSection('Day of Coordination', `<p>Our team will do their best to follow the schedule based on the timeline you provided. However, the team will not serve as coordinators or planners on the wedding day. If the schedule changes or runs late, the team cannot be held responsible for photos not captured due to time constraints.</p>${miscChoice('I understand')}`)}
    ${miscSection('Photo & Video Completion', `<p>After the wedding, you can expect to receive your wedding photos and/or video in approximately 8 to 11 weeks. You will receive an email from nikola@leimageinc.com with links to access your photos and/or video. Please check your spam folder as well.</p>${miscChoice('I understand')}`)}
    ${miscSection('Other Wedding Vendors', `<p>We often coordinate with your other wedding vendors while preparing for the wedding day. Please answer the questions below about your vendor team.</p><div class="misc-vendor-grid">${vendorFields.map((item, index) => miscTextarea(`${item[0]}${index === 0 ? ' *' : ''}`, item[1])).join('')}</div>`)}
    ${miscSection('Wedding Planning Call', `<p>If you have questions about the event timeline or would like to review the final schedule with us, you can schedule a planning call below.</p><a class="misc-call-btn" href="https://calendly.com/leimage/timeline" target="_blank" rel="noopener">Set up a call</a>`)}
    <div class="misc-footer"><button class="blue-btn misc-submit">SUBMIT MISCELLANEOUS INFO</button></div>
  </section>`;
}
function timeline() {
  if (document.querySelector('.package-list')) syncTimelineTeamFromPackage();
  syncActiveTimeline();
  const activeIndex = activeTeamIndex();
  const modeLabel = `${state.teamMembers[activeIndex] || 'Photographer'} Timeline`;
  const teamButtons = state.teamMembers.map((member, index) => `<div class="timeline-option team-member ${index === 0 ? 'primary-team-member' : ''}"><button class="${state.timelineMode === `team-${index}` ? 'active' : ''}" data-timeline-mode="team-${index}"><span>${member}</span>${index > 0 ? '<span class="link-timeline" aria-label="Link team member timeline" data-link-team="'+index+'">🔗</span>' : ''}</button></div>`).join('');
  return `<article class="card timeline-info"><h2>Event Timeline info</h2><p>This timeline will serve as a guideline for our photographers/videographers on your event day. Our photographers are great at what they do, however it takes time to create the beautiful shots you see in our event photography. Be sure to remember to allow extra time for traveling between venues/locations, party member delays, traffic etc. We have shot tons of events and in our experience even the most well planned event always has unexpected delays. Therefore we ask that you allot extra time to each category just in case! Please be sure to read our suggestions for each section and assign the time accordingly. If you have more than one photographer or videographer be sure to fill out the info for the “Second Timeline” as well.</p></article>
  <nav class="abs timeline-sections"><div class="team-head"><span>Team</span><button type="button" class="team-add" aria-label="Add team member" data-add-team-member>+</button></div>${teamButtons}${activeIndex > 0 ? '<button type="button" class="delete team-delete" data-delete-team-member><span class="delete-x">×</span><span class="delete-text">delete team member</span></button>' : ''}<button class="submit-timeline">Submit The Timeline</button></nav>
  ${state.teamNamePopup ? teamNamePopup() : ''}
  ${state.linkPopup ? linkTimelinePopup() : ''}
  ${state.confirmAction ? confirmPopup() : ''}
  ${state.addCardPopup ? addCardPopup() : ''}
  ${state.customSlotNamePopup ? customSlotNamePopup() : ''}
  <div class="abs timeline-list-head"><span>${modeLabel}</span><button class="add-slot" aria-label="Add another time slot" data-add-slot>+</button></div><section class="abs slots">${state.timeline.map(slot).join('')}</section>${editor()}`;
}
function teamNamePopup() { const editing = state.teamNameIndex !== null; const value = editing ? state.teamMembers[state.teamNameIndex] : ''; return `<form class="abs team-name-popover" data-team-name-form><strong>${editing ? 'Rename Team Member' : 'Add Team Member'}</strong><input class="input" name="teamName" value="${value}" placeholder="Videographer" autofocus><div><button type="submit" class="blue-btn">${editing ? 'Save' : 'Add'}</button><button type="button" data-cancel-team-name>Cancel</button></div></form>`; }
function linkTimelinePopup() { const subjectIndex = state.linkPopupIndex ?? activeTeamIndex(); const top = 560 + (subjectIndex * 76); const choices = state.teamMembers.map((member, index) => ({member, index})).filter(item => item.index !== subjectIndex); return `<aside class="abs link-popover" style="--link-popover-top:${top}px"><strong>Link this timeline with:</strong>${choices.map(item => `<button data-link-choice="team-${item.index}">${item.member}</button>`).join('')}</aside>`; }
function confirmPopup() { const isTeam = state.confirmAction?.type === 'team'; return `<aside class="abs confirm-popover"><strong>${isTeam ? 'Delete team member?' : 'Delete timeline slot?'}</strong><p>This cannot be undone.</p><div><button type="button" class="blue-btn confirm-yes" data-confirm-yes>Delete</button><button type="button" data-confirm-no>Cancel</button></div></aside>`; }
function addCardPopup() { return `<aside class="abs add-card-popover"><strong>Add Time Slot</strong>${defaultTimelineCards.map(title => `<button type="button" data-add-card="${title}">${title}</button>`).join('')}<button type="button" class="custom-card" data-custom-card>CUSTOM TIME SLOT</button></aside>`; }
function customSlotNamePopup() { return `<aside class="abs custom-slot-popover"><strong>Name custom time slot</strong><form data-custom-slot-form><input class="input" name="customSlotName" placeholder="Custom time slot name" autocomplete="off"><div><button type="button" data-custom-slot-cancel>Cancel</button><button type="submit" class="blue-btn">Add</button></div></form></aside>`; }
function savedLocationMatches(query = state.locationQuery || '') { const q = query.trim().toLowerCase(); return state.savedLocations.map((loc, index) => ({loc, index})).filter(item => !q || item.loc.name.toLowerCase().includes(q) || fullLocationText(item.loc).toLowerCase().includes(q)); }
function savedLocationDropdown() { if (!state.locationPopup || !state.savedLocations.length) return ''; const matches = savedLocationMatches(); if (!matches.length) return ''; return `<div class="saved-location-dropdown">${matches.map(({loc, index}) => `<button type="button" data-saved-location="${index}"><strong>${loc.name}</strong><span>${fullLocationText(loc)}</span></button>`).join('')}</div>`; }
function displayCardTime(value) { return String(value || '').replace(/\s*(AM|PM)$/i, ''); }
function displayCardDetail(value) { return String(value || '').replace(/(\d{1,2}:\d{2})\s*(AM|PM)/gi, '$1'); }
function slotCardDetail(s) { const loc = slotLocation(s); const time = `${displayCardTime(s[0])} - ${displayCardTime(s[1])}`; if (loc?.name) return `${time} | ${loc.name}`; return displayCardDetail(s[3]); }
function slot(s, i) { const detail = String(s[3] || '').toLowerCase(); const hasInfo = Boolean(s[3] && !detail.includes('please define') && !detail.includes('time range')); const short = state.shortSlots.includes(i); const status = hasInfo ? (short ? 'bad' : 'complete') : 'empty'; return `<article class="slot ${state.selectedSlot === i ? 'selected' : ''} slot-${status}" data-slot="${i}"><button class="slot-click" data-slot="${i}" aria-label="Edit ${s[2]}"></button><div class="slot-node"><i></i></div><div class="abs slot-time ${status}"><span>${displayCardTime(s[0])}</span><i></i><span>${displayCardTime(s[1])}</span></div><div class="abs slot-main" draggable="true" data-drag-slot="${i}"><h3>${s[2]}</h3><p>${slotCardDetail(s)}</p>${s[4]?`<p class="slot-note">${s[4]}</p>`:''}</div></article>`; }
function timeOptions() { const hours = Array.from({length:12}, (_, i) => i + 1); const minutes = Array.from({length:60}, (_, i) => String(i).padStart(2, '0')); return `<div class="time-wheel" data-time-wheel><div class="wheel-col" data-wheel="hour"><strong>Hour</strong>${hours.map(h => `<button type="button" data-time-part="hour" data-value="${h}">${h}</button>`).join('')}</div><div class="wheel-col" data-wheel="minute"><strong>Min</strong>${minutes.map(m => `<button type="button" data-time-part="minute" data-value="${m}">${m}</button>`).join('')}</div><div class="wheel-col ampm" data-wheel="ampm"><strong>AM/PM</strong><button type="button" data-time-part="ampm" data-value="AM">AM</button><button type="button" data-time-part="ampm" data-value="PM">PM</button></div></div>`; }
function cityStateZipText(loc) { const cityState = [loc?.city, loc?.state].filter(Boolean).join(', '); return [cityState, loc?.zip].filter(Boolean).join(' '); }
function fullLocationText(loc) { const isHotel = /hotel/i.test(loc?.name || ''); const secondLine = loc?.address2 ? (isHotel ? `Hotel room ${loc.address2}` : loc.address2) : ''; return [loc?.name, loc?.address1, secondLine, cityStateZipText(loc)].filter(Boolean).join(', '); }
function slotLocation(slot) { return slot?.[6] || null; }
function slotLocationText(slot) { const loc = slotLocation(slot); if (loc) return loc.saved ? fullLocationText(loc) : (loc.name || ''); const text = slot?.[3] || ''; const lower = text.toLowerCase(); if (lower.includes('time range') || lower.includes('please define')) return ''; return text.includes('|') ? text.split('|').slice(1).join('|').trim() : text; }
function selectedLocationSummary(slot) { return ''; }
function selectedTimelineSlot() { return state.timeline[Math.min(state.selectedSlot, state.timeline.length - 1)] || ['0:00','0:00','NEW TIMESLOT','Time range','',false]; }
function editorNote(slot) { const title = String(slot[2] || ''); const family = title.includes('FAMILY PORTRAITS'); if (family) return `<div class="note-box family-note"><strong>NOTE</strong><p>We need a list of family members you want posed photos with. Be sure to include arrangements you want to ensure we schedule enough time for your family photos. In most cases we recommend no more than 10-12 arrangements (apx. 20-30 mins of shooting)</p><p class="family-examples">Example:<br>Bride & groom with bride's mom<br>Bride & groom with groom's uncle and aunt<br>Bride with sister<br>Groom with brother</p></div>`; if (title.includes('FIRST LOOK')) return `<div class="note-box"><strong>NOTE</strong><p>A first look is when the couple sees each other before the ceremony, giving us time to capture portraits before guests arrive. It is a great option because it keeps the day moving, frees up more time after the ceremony, and lets you spend more of your celebration with family and friends. If you choose not to do a first look, we will take these portraits after the ceremony, when the schedule may be tighter.</p></div>`; if (title.includes('COUPLE PORTRAITS')) return `<div class="note-box"><strong>NOTE</strong><p>We recommend allowing at least 1 hour for couple portraits. This gives us enough time to create a strong set of images without rushing, and it also protects the rest of the timeline if earlier parts of the day run behind. Delays during getting ready, hair and makeup, or final touch ups can easily shift the schedule, so building in enough portrait time helps keep the day on track.</p></div>`; if (title.includes('BRIDAL PARTY PORTRAITS')) return `<div class="note-box"><strong>NOTE</strong><p>The amount of time needed for bridal party portraits depends on the size of the bridal party, how many photo combinations you want, and how quickly everyone is ready and cooperative. Larger bridal parties usually need more time, so please allow enough room in the schedule to keep this part organized and stress free.</p></div>`; if (title.includes('CEREMONY')) return `<div class="note-box"><strong>NOTE</strong><p>Please allow our team extra time to prepare before the ceremony. Videographers need time to set up cameras, connect to the audio mixer when available, and place lav mics on the groom and officiant or priest. Churches can sometimes be especially challenging for sound. Photographers also need time to prepare equipment, change batteries, clean lenses, and be ready before the ceremony begins.</p></div>`; if (title.includes('COCKTAIL HOUR')) return `<div class="note-box"><strong>NOTE</strong><p>During cocktail hour, we capture candid photos of guests chatting, drinking, and enjoying the event. When the reception room is ready, we also photograph the decor, table settings, and overall reception setup before guests enter the space.</p></div>`; if (title.includes('RECEPTION')) return `<div class="note-box"><strong>NOTE</strong><p>Reception coverage is mostly candid and documentary. We photograph what is happening naturally throughout the celebration. If you have any special events planned during the reception, please let us know so our team is prepared and in position.</p></div>`; return `<div class="note-box"><strong>NOTE</strong><p>Our photographer will capture your getting ready photos, which will include your dress, shoes, details. Please be sure to have your invitations, rings, bouquet and anything else you would like photographed set aside for our team. We recommend at least 1 hour total for getting ready.</p></div>`; }
function noteLabel(slot) { return String(slot[2] || '').includes('FAMILY PORTRAITS') ? 'Family photo arrangements' : 'Additional notes'; }
function notePlaceholder(slot) { return String(slot[2] || '').includes('FAMILY PORTRAITS') ? 'List each family photo arrangement on its own line' : 'Please write if there is anything else you want us to know'; }
function editor() { const s = selectedTimelineSlot(); const place = slotLocationText(s); const isFamily = String(s[2] || '').includes('FAMILY PORTRAITS'); const address2Placeholder = /hotel/i.test(place) ? 'Room number' : 'Address 2'; const noteValue = isFamily ? familyArrangementValue(s[4]) : (s[4] || ''); return `<aside class="abs editor ${isFamily ? 'family-editor' : ''}"><h2><span class="editor-title-text">${s[2]}</span><button class="edit-title" type="button" aria-label="Edit time slot title">✎</button></h2><div class="warning" role="alert">You have selected less time than recommended</div>${editorNote(s)}<form id="timeline-form"><label><span class="field-label">Time range</span><div class="time-picker"><span>From</span><div class="time-control"><input class="input" name="from" value="${s[0]}" placeholder="From" readonly data-clock-input="from"><button type="button" class="clock-btn" data-clock="from">◷</button><div class="clock-panel" data-clock-panel="from">${timeOptions()}</div></div><span>To</span><div class="time-control"><input class="input" name="to" value="${s[1]}" placeholder="To" readonly data-clock-input="to"><button type="button" class="clock-btn" data-clock="to">◷</button><div class="clock-panel" data-clock-panel="to">${timeOptions()}</div></div></div></label><label class="location-name-label"><span class="field-label">Location name</span><input class="input" name="place" value="${place}" placeholder="Restaurant, hotel, venue" data-place-name>${selectedLocationSummary(s)}${savedLocationDropdown()}<datalist id="venue-suggestions"><option value="The Plaza Hotel"><option value="Brooklyn Botanic Garden"><option value="The River Cafe"><option value="501 Union"><option value="The Foundry"></datalist></label><label class="location-address-fields ${slotLocation(s)?.saved ? 'is-hidden' : ''}" style="${slotLocation(s)?.saved ? 'display:none !important' : ''}"><span class="field-label">Location address</span><div class="address-grid"><input class="input" name="address1" placeholder="Address 1" data-address-one><input class="input" name="address2" placeholder="${address2Placeholder}"></div></label><div class="address-grid address-grid--cityzip location-address-fields ${slotLocation(s)?.saved ? 'is-hidden' : ''}" style="${slotLocation(s)?.saved ? 'display:none !important' : ''}"><label><span class="field-label field-label--visually-hidden">City</span><input class="input" name="city" placeholder="City"></label><label><span class="field-label field-label--visually-hidden">State</span><input class="input" name="state" placeholder="State"></label><label><span class="field-label field-label--visually-hidden">Zip code</span><input class="input" name="zip" placeholder="Zip code"></label></div><label><span class="field-label">${noteLabel(s)}</span><textarea class="input ${isFamily ? 'family-arrangements-input' : ''}" name="note" placeholder="${notePlaceholder(s)}">${noteValue}</textarea></label><div class="editor-actions"><button type="button" class="delete" data-delete-selected><span class="delete-x">×</span><span class="delete-text">delete time slot</span></button><span>or</span><button type="button" class="blue-btn save-btn">Save changes</button></div></form></aside>`; }
function faq() { return `<aside class="abs faq-help"><h2>Got questions?</h2><p>Hopefully this will help, but if there’s anything else you want to ask us about, call us at 718.971.9710</p></aside><section class="abs faq-content">${faqSection('Your contract', [['Where can I find my contract?', 'The copy of your contract is located on Event info tab.'], ['There are parts of my contract I don’t understand, what do I do?', 'Give us a call at the studio for clarification']])}${faqSection('Payments', [['How do I make a payment or see my current balance?', 'Click on the Payments/Billing Tab and your current balance will be listed'], ['When is my final payment due?', 'Your final payment is due 14 days prior to your event'], ['What are my payment options?', 'We accept card, check, money order and cash, however you can only use this app for payments with cards. For other methods of payment contact our studio directly.'], ['Why is the total balance higher than the price listed on your website?', 'The prices on our website do not include NY State sales tax and/or any applicable fees.']])}</section>`; }
function faqSection(title, items) { return `<section class="faq-section"><h2>${title}</h2>${items.map(i=>`<article class="faq-item"><h3>${i[0]}</h3><p>${i[1]}</p></article>`).join('')}</section>`; }

function bind() {
  document.querySelector('#signin-form')?.addEventListener('submit', e => { e.preventDefault(); state.loggedIn = true; sessionStorage.setItem('wedding-dashboard-auth','1'); state.route='home'; location.hash='home'; render(); });
  document.querySelector('[data-event-info-edit]')?.addEventListener('click', e => { e.preventDefault(); state.eventInfoEditing = !state.eventInfoEditing; render(); });
  document.querySelectorAll('[data-event-info-field]').forEach(input => input.addEventListener('input', e => { state.eventInfo[e.target.dataset.eventInfoField] = e.target.value; }));
  document.querySelector('[data-event-photo-input]')?.addEventListener('change', e => setEventInfoPhoto(e.target.files?.[0]));
  document.querySelector('[data-event-photo-drop]')?.addEventListener('click', e => { if (!state.eventInfoEditing || e.target.matches?.('[data-event-photo-input]')) return; e.preventDefault(); e.stopPropagation(); if (state.eventInfoPhotoMoved) { state.eventInfoPhotoMoved = false; return; } document.querySelector('[data-event-photo-input]')?.click(); });
  document.querySelector('[data-event-photo-drop]')?.addEventListener('pointerdown', startEventInfoPhotoDrag);
  document.querySelector('[data-event-photo-drop]')?.addEventListener('pointermove', moveEventInfoPhoto);
  document.querySelector('[data-event-photo-drop]')?.addEventListener('pointerup', endEventInfoPhotoDrag);
  document.querySelector('[data-event-photo-drop]')?.addEventListener('pointercancel', endEventInfoPhotoDrag);
  document.querySelector('[data-event-photo-drop]')?.addEventListener('dragover', e => { if (!state.eventInfoEditing) return; e.preventDefault(); e.currentTarget.classList.add('is-dragging'); });
  document.querySelector('[data-event-photo-drop]')?.addEventListener('dragleave', e => e.currentTarget.classList.remove('is-dragging'));
  document.querySelector('[data-event-photo-drop]')?.addEventListener('drop', e => { if (!state.eventInfoEditing) return; e.preventDefault(); e.currentTarget.classList.remove('is-dragging'); setEventInfoPhoto(e.dataTransfer?.files?.[0]); });
  document.querySelectorAll('[data-payment-method]').forEach(b => b.addEventListener('click', e => selectPaymentMethod(e, b.dataset.paymentMethod)));
  document.querySelectorAll('[data-payment-lookup]').forEach(input => input.addEventListener('input', e => {
    const q = e.target.value.trim().toLowerCase();
    e.target.closest('.payment-lookup')?.querySelectorAll('[data-payment-lookup-choice]').forEach(btn => btn.classList.toggle('is-hidden', q && !btn.textContent.toLowerCase().includes(q)));
  }));
  document.querySelectorAll('[data-payment-lookup-choice]').forEach(btn => btn.addEventListener('pointerdown', e => {
    e.preventDefault();
    e.stopPropagation();
    const input = btn.closest('.payment-lookup')?.querySelector('[data-payment-lookup]');
    if (input) input.value = btn.dataset.paymentLookupChoice;
    btn.closest('.payment-lookup')?.querySelectorAll('[data-payment-lookup-choice]').forEach(item => item.classList.remove('is-hidden'));
    input?.blur();
  }));
  document.querySelector('[data-payment-amount]')?.addEventListener('input', e => { state.paymentAmount = formatPaymentAmount(e.target.value); e.target.value = state.paymentAmount; });
  document.querySelector('[data-payment-amount]')?.addEventListener('blur', e => { state.paymentAmount = formatPaymentAmount(e.target.value); e.target.value = state.paymentAmount; });
  document.querySelectorAll('[data-route]').forEach(b => b.addEventListener('click', () => { if (b.dataset.route === 'timeline') syncTimelineTeamFromPackage(); state.route=b.dataset.route; state.menuOpen=false; location.hash=state.route; render(); }));
  document.querySelectorAll('[data-upgrade-add]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); addPackageUpgrade(b.dataset.upgradeAdd); }));
  document.querySelectorAll('[data-upgrade-choice]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); openUpgradeChoice(b.dataset.upgradeChoice); }));
  document.querySelectorAll('[data-payment-adjustment-amount]').forEach(input => input.addEventListener('change', e => { if (state.isAdmin) updatePaymentAdjustment(e.target.dataset.paymentAdjustmentAmount, e.target.value); }));
  document.addEventListener('change', e => {
    const input = e.target.closest?.('[data-payment-adjustment-amount]');
    if (input && state.isAdmin) updatePaymentAdjustment(input.dataset.paymentAdjustmentAmount, input.value);
    const label = e.target.closest?.('[data-payment-adjustment-label]');
    if (label) savePaymentAdjustmentLabel(label.dataset.paymentAdjustmentLabel, label.value);
  });
  document.addEventListener('keydown', e => {
    const input = e.target.closest?.('[data-payment-adjustment-amount]');
    if (input && e.key === 'Enter') {
      e.preventDefault();
      if (!state.isAdmin) return;
      const row = input.closest('[data-payment-adjustment-row]');
      if (row?.classList.contains('pay-adjustment-row-other')) finishPaymentAdjustmentEdit(input.dataset.paymentAdjustmentAmount);
      else updatePaymentAdjustment(input.dataset.paymentAdjustmentAmount, input.value);
      input.blur();
    }
    const label = e.target.closest?.('[data-payment-adjustment-label]');
    if (label && e.key === 'Enter') {
      e.preventDefault();
      const row = label.closest('[data-payment-adjustment-row]');
      if (row?.classList.contains('pay-adjustment-row-other')) finishPaymentAdjustmentEdit(label.dataset.paymentAdjustmentLabel);
      else savePaymentAdjustmentLabel(label.dataset.paymentAdjustmentLabel, label.value);
    }
  });
  document.addEventListener('pointerdown', e => {
    const paymentPlus = e.target.closest('[data-payment-plus]');
    if (paymentPlus) {
      if (!state.isAdmin) return;
      e.preventDefault();
      e.stopPropagation();
      const popup = document.querySelector('[data-payment-plus-popup]');
      if (popup) popup.hidden = !popup.hidden;
      return;
    }
    const paymentOption = e.target.closest('[data-payment-option]');
    if (paymentOption) {
      if (!state.isAdmin) return;
      e.preventDefault();
      e.stopPropagation();
      addPaymentAdjustment(paymentOption.dataset.paymentOption);
      return;
    }
    const openPaymentPopup = document.querySelector('[data-payment-plus-popup]:not([hidden])');
    if (openPaymentPopup && !e.target.closest('[data-payment-plus-popup]')) {
      closePaymentPlusPopup();
    }
    const adjustmentRemove = e.target.closest('[data-payment-adjustment-remove]');
    if (adjustmentRemove) {
      if (!state.isAdmin) return;
      e.preventDefault();
      e.stopPropagation();
      removePaymentAdjustment(adjustmentRemove.dataset.paymentAdjustmentRemove);
      return;
    }
    const adjustmentRename = e.target.closest('[data-payment-adjustment-rename]');
    if (adjustmentRename) {
      if (!state.isAdmin) return;
      e.preventDefault();
      e.stopPropagation();
      renamePaymentAdjustment(adjustmentRename.dataset.paymentAdjustmentRename);
      return;
    }
    const adjustmentDone = e.target.closest('[data-payment-adjustment-done]');
    if (adjustmentDone) {
      if (!state.isAdmin) return;
      e.preventDefault();
      e.stopPropagation();
      finishPaymentAdjustmentEdit(adjustmentDone.dataset.paymentAdjustmentDone);
      return;
    }
    const upgradeLineAdjustButton = e.target.closest('[data-package-upgrade-line-adjust]');
    if (upgradeLineAdjustButton) {
      e.preventDefault();
      e.stopPropagation();
      const upgrade = upgradeLineAdjustButton.dataset.packageUpgradeLineAdjust;
      const titleLine = upgradeLineAdjustButton.closest('.package-upgrade-title');
      if (!titleLine) return;
      const delta = Number(upgradeLineAdjustButton.dataset.delta || 1);
      const floor = upgrade.includes('content') ? 4 : 6;
      const lockedMin = state.isAdmin ? floor : Number(titleLine.dataset.minHours || titleLine.dataset.hours || floor);
      const nextHours = Math.max(lockedMin, Math.min(14, Number(titleLine.dataset.hours || 8) + delta));
      titleLine.dataset.hours = String(nextHours);
      refreshPackageUpgradeItem(upgrade);
      syncClientPackageMinimumControls();
      updatePackageBalance();
      syncHomeGridHeight();
      return;
    }
    const lineAdjustButton = e.target.closest('[data-package-line-adjust]');
    if (lineAdjustButton) {
      e.preventDefault();
      e.stopPropagation();
      const controlKey = lineAdjustButton.dataset.packageLineAdjust;
      const delta = Number(lineAdjustButton.dataset.delta || 1);
      const titleLine = lineAdjustButton.closest('.package-base-title');
      const current = builderValue(controlKey);
      const lockedMin = state.isAdmin ? -Infinity : Number(titleLine?.dataset.minHours || titleLine?.dataset.minQty || current);
      const nextValue = Math.max(lockedMin, current + (controlKey === 'retouching' ? delta * 10 : delta));
      builderSetValue(controlKey, nextValue);
      const affected = Object.entries(basePackageDefinitions()).filter(([, def]) => def.controlKey === controlKey).map(([key]) => key);
      affected.forEach(key => refreshBasePackageItem(key, titleLine?.dataset.shootDate || ''));
      syncClientPackageMinimumControls();
      syncHomeGridHeight();
      return;
    }
    const adjustButton = e.target.closest('[data-package-adjust]');
    if (adjustButton) {
      if (!state.isAdmin) return;
      e.preventDefault();
      e.stopPropagation();
      const controlKey = adjustButton.dataset.packageAdjust;
      const delta = Number(adjustButton.dataset.delta || 1);
      builderSetValue(controlKey, builderValue(controlKey) + delta);
      syncPackageBuilderState();
      return;
    }
    const builderAddDay = e.target.closest('[data-package-builder-add-day]');
    if (builderAddDay) {
      if (!state.isAdmin) return;
      e.preventDefault();
      e.stopPropagation();
      const bs = builderState();
      bs.calendarOpen = !bs.calendarOpen;
      bs.calendarMonth ||= /^\d{4}-\d{2}-\d{2}$/.test(bs.activeDate || '') ? bs.activeDate : '';
      syncPackageBuilderState();
      return;
    }
    const builderDateMonth = e.target.closest('[data-builder-date-month]');
    if (builderDateMonth) {
      if (!state.isAdmin) return;
      e.preventDefault();
      e.stopPropagation();
      const bs = builderState();
      const source = bs.calendarMonth || (/^\d{4}-\d{2}-\d{2}$/.test(bs.activeDate || '') ? bs.activeDate : '');
      const current = source ? new Date(`${source}T12:00:00`) : new Date();
      const next = new Date(current.getFullYear(), current.getMonth() + Number(builderDateMonth.dataset.builderDateMonth || 0), 1);
      bs.calendarMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`;
      bs.calendarOpen = true;
      syncPackageBuilderState();
      return;
    }
    const packageDateSwitch = e.target.closest('[data-package-date-switch]');
    if (packageDateSwitch) {
      if (!state.isAdmin) return;
      e.preventDefault();
      e.stopPropagation();
      const bs = builderState();
      bs.activeDate = packageDateSwitch.dataset.packageDateSwitch || originalPackageDate();
      bs.calendarMonth = /^\d{4}-\d{2}-\d{2}$/.test(bs.activeDate) ? bs.activeDate : bs.calendarMonth;
      bs.calendarOpen = false;
      bs.done = false;
      syncPackageBuilderState();
      syncHomeGridHeight();
      return;
    }
    const builderDatePick = e.target.closest('[data-builder-date-pick]');
    if (builderDatePick) {
      if (!state.isAdmin) return;
      e.preventDefault();
      e.stopPropagation();
      const bs = builderState();
      bs.activeDate = builderDatePick.dataset.builderDatePick;
      bs.calendarMonth = bs.activeDate;
      bs.calendarOpen = false;
      bs.done = false;
      syncPackageBuilderState();
      syncHomeGridHeight();
      return;
    }
    const builderToggle = e.target.closest('[data-package-builder-toggle]');
    if (builderToggle) {
      if (!state.isAdmin) return;
      e.preventDefault();
      e.stopPropagation();
        const hasAnyPackage = document.querySelector('.package-list')?.children.length > 0;
      builderState().done = hasAnyPackage ? !builderState().done : false;
      syncPackageBuilderState();
      syncHomeGridHeight();
      return;
    }
    const builderDone = e.target.closest('[data-package-builder-done]');
    if (builderDone) {
      if (!state.isAdmin) return;
      e.preventDefault();
      e.stopPropagation();
      builderState().done = true;
      syncPackageBuilderState();
      syncHomeGridHeight();
      return;
    }
    const buildButton = e.target.closest('[data-package-build]');
    if (buildButton) {
      if (!state.isAdmin) return;
      e.preventDefault();
      e.stopPropagation();
      addBasePackageItem(buildButton.dataset.packageBuild);
      return;
    }
    const baseRemoveButton = e.target.closest('[data-base-package-remove]');
    if (baseRemoveButton) {
      if (!state.isAdmin) return;
      e.preventDefault();
      e.stopPropagation();
      removeBasePackageItem(baseRemoveButton.dataset.basePackageRemove, baseRemoveButton.closest('[data-shoot-date]')?.dataset.shootDate || '');
      return;
    }
    const cardUpgradeButton = e.target.closest('[data-card-upgrade-choice]');
    if (cardUpgradeButton) {
      e.preventDefault();
      e.stopPropagation();
      openUpgradeChoice(cardUpgradeButton.dataset.cardUpgradeChoice);
      return;
    }
    const choiceButton = e.target.closest('[data-upgrade-choice]');
    if (choiceButton) {
      e.preventDefault();
      e.stopPropagation();
      openUpgradeChoice(choiceButton.dataset.upgradeChoice);
      return;
    }
    if (e.target.closest('[data-book-plus], [data-book-minus], [data-book-choice], [data-photo-book-submit], [data-booth-check], [data-booth-date], [data-booth-choice], [data-photo-booth-submit]')) return;
    const submitBooks = e.target.closest('[data-photo-book-submit]');
    if (submitBooks) {
      e.preventDefault();
      e.stopPropagation();
      submitPhotoBookChoices();
      return;
    }
    const button = e.target.closest('[data-upgrade-add]');
    if (!button) return;
    e.preventDefault();
    e.stopPropagation();
    addPackageUpgrade(button.dataset.upgradeAdd);
  }, true);
  document.addEventListener('click', e => {
    const photoToggle = e.target.closest('[data-photo-calendar-toggle]');
    if (photoToggle) { e.preventDefault(); e.stopPropagation(); const state = photoChoiceState(); window.__photoChoice = {...state, calendarOpen: !(state.calendarOpen !== false)}; renderPhotographyChoicePopup(); return; }
    const photoPrev = e.target.closest('[data-photo-month-prev]');
    const photoNext = e.target.closest('[data-photo-month-next]');
    if (photoPrev || photoNext) { e.preventDefault(); e.stopPropagation(); if (!(photoPrev || photoNext).disabled) shiftPhotoCalendar(photoNext ? 1 : -1); return; }
    const photoDatePick = e.target.closest('[data-photo-date-pick]');
    if (photoDatePick) { e.preventDefault(); e.stopPropagation(); if (!photoDatePick.disabled) setPhotoDate(photoDatePick.dataset.photoDatePick); return; }
    const photoCheck = e.target.closest('[data-photo-check]');
    if (photoCheck) { e.preventDefault(); e.stopPropagation(); checkPhotoAvailability(); return; }
    const photoMinus = e.target.closest('[data-photo-hours-minus]');
    const photoPlus = e.target.closest('[data-photo-hours-plus]');
    if (photoMinus || photoPlus) { e.preventDefault(); e.stopPropagation(); changePhotoHours((photoMinus || photoPlus).dataset.photoHoursMinus || (photoMinus || photoPlus).dataset.photoHoursPlus, photoPlus ? 1 : -1); return; }
    const photoChoice = e.target.closest('[data-photo-choice]');
    if (photoChoice) { e.preventDefault(); e.stopPropagation(); if (!photoChoice.classList.contains('is-disabled')) selectPhotoChoice(photoChoice.dataset.photoChoice); return; }
    const photoSubmit = e.target.closest('[data-photo-submit]');
    if (photoSubmit) { e.preventDefault(); e.stopPropagation(); submitPhotoChoice(); return; }
    const videoToggle = e.target.closest('[data-video-calendar-toggle]');
    if (videoToggle) { e.preventDefault(); e.stopPropagation(); const state = videoChoiceState(); window.__videoChoice = {...state, calendarOpen: !(state.calendarOpen !== false)}; renderVideoChoicePopup(); return; }
    const videoPrev = e.target.closest('[data-video-month-prev]');
    const videoNext = e.target.closest('[data-video-month-next]');
    if (videoPrev || videoNext) { e.preventDefault(); e.stopPropagation(); if (!(videoPrev || videoNext).disabled) shiftVideoCalendar(videoNext ? 1 : -1); return; }
    const videoDatePick = e.target.closest('[data-video-date-pick]');
    if (videoDatePick) { e.preventDefault(); e.stopPropagation(); if (!videoDatePick.disabled) setVideoDate(videoDatePick.dataset.videoDatePick); return; }
    const videoCheck = e.target.closest('[data-video-check]');
    if (videoCheck) { e.preventDefault(); e.stopPropagation(); checkVideoAvailability(); return; }
    const videoMinus = e.target.closest('[data-video-hours-minus]');
    const videoPlus = e.target.closest('[data-video-hours-plus]');
    if (videoMinus || videoPlus) { e.preventDefault(); e.stopPropagation(); changeVideoHours((videoMinus || videoPlus).dataset.videoHoursMinus || (videoMinus || videoPlus).dataset.videoHoursPlus, videoPlus ? 1 : -1); return; }
    const videoEdit = e.target.closest('[data-video-edit]');
    if (videoEdit) { e.preventDefault(); e.stopPropagation(); toggleVideoEdit(videoEdit.dataset.videoEdit); return; }
    const videoChoice = e.target.closest('[data-video-choice]');
    if (videoChoice) { e.preventDefault(); e.stopPropagation(); if (!videoChoice.classList.contains('is-disabled')) selectVideoChoice(videoChoice.dataset.videoChoice); return; }
    const videoSubmit = e.target.closest('[data-video-submit]');
    if (videoSubmit) { e.preventDefault(); e.stopPropagation(); submitVideoChoice(); return; }
    const contentToggle = e.target.closest('[data-content-calendar-toggle]');
    if (contentToggle) { e.preventDefault(); e.stopPropagation(); const state = contentCreationChoiceState(); window.__contentCreationChoice = {...state, calendarOpen: !(state.calendarOpen !== false)}; renderContentCreationChoicePopup(); return; }
    const contentPrev = e.target.closest('[data-content-month-prev]');
    const contentNext = e.target.closest('[data-content-month-next]');
    if (contentPrev || contentNext) { e.preventDefault(); e.stopPropagation(); if (!(contentPrev || contentNext).disabled) shiftContentCalendar(contentNext ? 1 : -1); return; }
    const contentDatePick = e.target.closest('[data-content-date-pick]');
    if (contentDatePick) { e.preventDefault(); e.stopPropagation(); if (!contentDatePick.disabled) setContentCreationDate(contentDatePick.dataset.contentDatePick); return; }
    const contentCheck = e.target.closest('[data-content-check]');
    if (contentCheck) { e.preventDefault(); e.stopPropagation(); checkContentAvailability(); return; }
    const contentMinus = e.target.closest('[data-content-hours-minus]');
    const contentPlus = e.target.closest('[data-content-hours-plus]');
    if (contentMinus || contentPlus) { e.preventDefault(); e.stopPropagation(); changeContentHours((contentMinus || contentPlus).dataset.contentHoursMinus || (contentMinus || contentPlus).dataset.contentHoursPlus, contentPlus ? 1 : -1); return; }
    const contentChoice = e.target.closest('[data-content-choice]');
    if (contentChoice) { e.preventDefault(); e.stopPropagation(); if (!contentChoice.classList.contains('is-disabled')) selectContentChoice(contentChoice.dataset.contentChoice); return; }
    const contentSubmit = e.target.closest('[data-content-submit]');
    if (contentSubmit) { e.preventDefault(); e.stopPropagation(); submitContentChoice(); return; }
    const boothToggle = e.target.closest('[data-booth-calendar-toggle]');
    if (boothToggle) {
      e.preventDefault();
      e.stopPropagation();
      const availability = window.__photoBoothAvailability || {};
      window.__photoBoothAvailability = {...availability, calendarOpen: !(availability.calendarOpen !== false)};
      renderPhotoBoothChoicePopup();
      return;
    }
    const boothMonthPrev = e.target.closest('[data-booth-month-prev]');
    const boothMonthNext = e.target.closest('[data-booth-month-next]');
    if (boothMonthPrev || boothMonthNext) {
      e.preventDefault();
      e.stopPropagation();
      if (!(boothMonthPrev || boothMonthNext).disabled) shiftPhotoBoothCalendar(boothMonthNext ? 1 : -1);
      return;
    }
    const boothDatePick = e.target.closest('[data-booth-date-pick]');
    if (boothDatePick) {
      e.preventDefault();
      e.stopPropagation();
      if (!boothDatePick.disabled) setPhotoBoothDate(boothDatePick.dataset.boothDatePick);
      return;
    }
    const boothCheck = e.target.closest('[data-booth-check]');
    if (boothCheck) {
      e.preventDefault();
      e.stopPropagation();
      checkPhotoBoothAvailability();
      return;
    }
    const boothChoice = e.target.closest('[data-booth-choice]');
    if (boothChoice) {
      e.preventDefault();
      e.stopPropagation();
      if (!boothChoice.disabled) selectPhotoBoothChoice(boothChoice.dataset.boothChoice);
      return;
    }
    const boothSubmit = e.target.closest('[data-photo-booth-submit]');
    if (boothSubmit) {
      e.preventDefault();
      e.stopPropagation();
      submitPhotoBoothChoice();
      return;
    }
    const bookPlus = e.target.closest('[data-book-plus]');
    const bookMinus = e.target.closest('[data-book-minus]');
    if (bookPlus || bookMinus) {
      e.preventDefault();
      e.stopPropagation();
      if (!window.__bookQtyPointerHandled) {
        changePhotoBookChoice((bookPlus || bookMinus).dataset.bookPlus || (bookPlus || bookMinus).dataset.bookMinus, bookPlus ? 1 : -1);
      }
      return;
    }
    const bookCard = e.target.closest('[data-book-choice]');
    if (bookCard) {
      e.preventDefault();
      e.stopPropagation();
      togglePhotoBookChoice(bookCard.dataset.bookChoice);
      return;
    }
    const submitBooks = e.target.closest('[data-photo-book-submit]');
    if (submitBooks) {
      e.preventDefault();
      e.stopPropagation();
      submitPhotoBookChoices();
      return;
    }
    const closeChoice = e.target.closest('[data-upgrade-choice-close]');
    if (closeChoice) {
      e.preventDefault();
      e.stopPropagation();
      closeUpgradeChoice();
      syncHomeGridHeight();
      return;
    }
    const choiceButton = e.target.closest('[data-upgrade-choice]');
    if (choiceButton) {
      e.preventDefault();
      e.stopPropagation();
      openUpgradeChoice(choiceButton.dataset.upgradeChoice);
      return;
    }
    const addButton = e.target.closest('[data-upgrade-add]');
    if (addButton) {
      e.preventDefault();
      e.stopPropagation();
      addPackageUpgrade(addButton.dataset.upgradeAdd);
      return;
    }
    const removeButton = e.target.closest('[data-upgrade-remove]');
    if (removeButton) {
      if (!state.isAdmin) return;
      e.preventDefault();
      e.stopPropagation();
      removePackageUpgrade(removeButton.dataset.upgradeRemove);
    }
  }, true);
  document.querySelector('[data-booth-date]')?.addEventListener('input', e => {
    window.__photoBoothAvailability = {date: e.currentTarget.value, status: 'idle'};
    renderPhotoBoothChoicePopup();
  });
  document.querySelector('[data-add-slot]')?.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); state.addCardPopup = !state.addCardPopup; state.linkPopup=false; state.teamNamePopup=false; render(); });
  document.querySelectorAll('[data-add-card]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); addTimelineCard(b.dataset.addCard); }));
  document.querySelector('[data-custom-card]')?.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); state.addCardPopup=false; state.customSlotNamePopup=true; render(); });
  document.querySelector('[data-custom-slot-cancel]')?.addEventListener('click', e => { e.preventDefault(); state.customSlotNamePopup=false; render(); });
  document.querySelector('[data-custom-slot-form]')?.addEventListener('submit', e => { e.preventDefault(); const name = e.currentTarget.customSlotName.value.trim() || 'CUSTOM TIME SLOT'; addTimelineCard(name.toUpperCase()); });
  if (state.customSlotNamePopup) setTimeout(() => document.querySelector('[name=customSlotName]')?.focus(), 0);
  document.querySelector('[data-add-team-member]')?.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); state.teamNamePopup = true; state.teamNameIndex = null; state.linkPopup=false; render(); });
  document.querySelector('[data-cancel-team-name]')?.addEventListener('click', e => { e.preventDefault(); state.teamNamePopup = false; state.teamNameIndex = null; render(); });
  document.querySelector('[data-team-name-form]')?.addEventListener('submit', e => { e.preventDefault(); const name = e.currentTarget.teamName.value.trim(); if (!name) return; if (state.teamNameIndex !== null) { state.teamMembers[state.teamNameIndex] = name; state.timelineMode = `team-${state.teamNameIndex}`; } else { state.teamMembers.push(name); state.teamTimelines.push(emptyTimeline()); state.timelineMode = `team-${state.teamMembers.length - 1}`; state.selectedSlot = 0; } state.teamNamePopup=false; state.teamNameIndex=null; state.linkPopup=false; render(); });
  document.querySelectorAll('[data-slot]').forEach(b => b.addEventListener('click', () => { state.selectedSlot = Number(b.dataset.slot); render(); }));
  document.querySelectorAll('[data-timeline-mode]').forEach(b => b.addEventListener('click', () => { state.timelineMode = b.dataset.timelineMode; state.selectedSlot = 0; syncActiveTimeline(); state.linkPopup=false; render(); }));
  document.querySelectorAll('[data-timeline-mode]').forEach(b => b.addEventListener('dblclick', e => { e.preventDefault(); e.stopPropagation(); const index = Number(String(b.dataset.timelineMode).replace('team-', '')) || 0; state.timelineMode = b.dataset.timelineMode; state.teamNameIndex = index; state.teamNamePopup = true; state.linkPopup=false; render(); }));
  document.querySelector('[data-delete-team-member]')?.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); const index = Number(String(state.timelineMode).replace('team-', '')) || 0; if (index <= 0 || state.teamMembers.length <= 1) return; state.confirmAction = {type:'team', index}; state.teamNamePopup=false; state.linkPopup=false; state.addCardPopup=false; render(); });
  document.querySelectorAll('[data-link-team]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); state.linkPopupIndex = Number(b.dataset.linkTeam) || activeTeamIndex(); state.linkPopup = !state.linkPopup || state.linkPopupIndex !== Number(b.dataset.linkTeam); render(); }));
  document.querySelectorAll('[data-link-choice]').forEach(b => b.addEventListener('click', () => { state.videographerSame = true; state.linkPopup=false; render(); }));
  document.querySelectorAll('[data-drag-slot]').forEach(card => {
    card.addEventListener('click', () => { state.selectedSlot = Number(card.dataset.dragSlot); render(); });
    card.addEventListener('dragstart', e => { e.stopPropagation(); e.dataTransfer.setData('text/plain', card.dataset.dragSlot); card.closest('.slot')?.classList.add('dragging'); });
    card.addEventListener('dragend', () => document.querySelectorAll('.slot').forEach(s => s.classList.remove('dragging','drop-target')));
    card.addEventListener('dragenter', e => { e.preventDefault(); card.closest('.slot')?.classList.add('drop-target'); });
    card.addEventListener('dragleave', () => card.closest('.slot')?.classList.remove('drop-target'));
    card.addEventListener('dragover', e => e.preventDefault());
    card.addEventListener('drop', e => { e.preventDefault(); const from = Number(e.dataTransfer.getData('text/plain')); const to = Number(card.dataset.dragSlot); document.querySelectorAll('.slot').forEach(s => s.classList.remove('dragging','drop-target')); if (Number.isNaN(from) || Number.isNaN(to) || from === to) return; const fromContent = state.timeline[from].slice(2); const toContent = state.timeline[to].slice(2); state.timeline[from].splice(2, fromContent.length, ...toContent); state.timeline[to].splice(2, toContent.length, ...fromContent); state.selectedSlot = to; render(); });
  });
  document.querySelector('.edit-title')?.addEventListener('click', e => { e.preventDefault(); startTitleEdit(); });
  if (state.editTitleAfterRender) { state.editTitleAfterRender = false; setTimeout(startTitleEdit, 0); }
  document.querySelector('[data-delete-selected]')?.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); if (state.timeline.length > 1) { state.confirmAction = {type:'slot', index:state.selectedSlot}; render(); } });
  document.querySelector('[data-confirm-no]')?.addEventListener('click', e => { e.preventDefault(); state.confirmAction = null; render(); });
  document.querySelector('[data-confirm-yes]')?.addEventListener('click', e => { e.preventDefault(); const action = state.confirmAction; if (!action) return; if (action.type === 'team') { state.teamMembers.splice(action.index, 1); state.teamTimelines.splice(action.index, 1); state.timelineMode = `team-${Math.max(0, action.index - 1)}`; } else if (action.type === 'slot' && state.timeline.length > 1) { state.timeline.splice(action.index, 1); state.selectedSlot = Math.max(0, Math.min(action.index - 1, state.timeline.length - 1)); } state.confirmAction = null; state.teamNamePopup=false; state.linkPopup=false; state.addCardPopup=false; render(); });
  document.querySelectorAll('#timeline-form input, #timeline-form textarea').forEach(input => input.addEventListener('input', () => { ensureFirstFamilyNumber(input); autoGrowTextarea(input); autoSaveSelectedSlot(true); }));
  document.querySelectorAll('textarea.family-arrangements-input').forEach(t => { t.addEventListener('keydown', handleFamilyArrangementKeydown); ensureFirstFamilyNumber(t); autoGrowTextarea(t); });
  document.querySelectorAll('#timeline-form [name=from], #timeline-form [name=to]').forEach(s => s.addEventListener('change', () => autoSaveSelectedSlot(true)));
  document.querySelectorAll('[data-clock-input]').forEach(input => input.addEventListener('click', () => openTimeWheel(input.dataset.clockInput)));
  document.querySelectorAll('[data-clock]').forEach(b => b.addEventListener('click', () => openTimeWheel(b.dataset.clock)));
  document.querySelectorAll('[data-time-part]').forEach(b => b.addEventListener('click', () => chooseTimePart(b)));
  document.querySelector('[data-place-name]')?.addEventListener('focus', initGooglePlacesAutocomplete);
  document.querySelector('[data-place-name]')?.addEventListener('click', openSavedLocationDropdown);
  document.querySelector('[data-place-name]')?.addEventListener('input', handleLocationTyping);
  initGooglePlacesAutocomplete();
  attachSavedLocationHandlers();
  document.querySelectorAll('[data-place-name],[data-address-one]').forEach(i => i.addEventListener('change', fillSuggestedAddress));
  document.querySelector('#timeline-form')?.addEventListener('submit', e => { e.preventDefault(); });
  document.querySelector('.save-btn')?.addEventListener('click', e => { e.preventDefault(); saveSelectedSlot(); });
}
window.addEventListener('hashchange', () => { const r=location.hash.replace('#','') || 'home'; if (state.loggedIn && routes.includes(r) && r!==state.route) { state.route=r; render(); }});
render();




function addTimelineCard(title) {
  const insertAt = Math.min(state.selectedSlot + 1, state.timeline.length);
  state.timeline.splice(insertAt, 0, ['0:00', '0:00', title, 'Time range', '', false]);
  state.selectedSlot = insertAt;
  state.addCardPopup = false;
  state.customSlotNamePopup = false;
  state.editTitleAfterRender = false;
  render();
}

function startTitleEdit() {
  const title = document.querySelector('.editor-title-text');
  if (!title || title.isContentEditable) return;
  title.contentEditable = 'true';
  title.classList.add('is-editing');
  title.focus();
  const range = document.createRange();
  range.selectNodeContents(title);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  const commit = () => { const value = (title.textContent.trim() || selectedTimelineSlot()[2]).toUpperCase(); selectedTimelineSlot()[2] = value; title.textContent = value; title.contentEditable = 'false'; title.classList.remove('is-editing'); updateSelectedSlotCard(); };
  title.addEventListener('input', () => { selectedTimelineSlot()[2] = (title.textContent.trim() || selectedTimelineSlot()[2]).toUpperCase(); updateSelectedSlotCard(); }, {once:false});
  title.addEventListener('blur', commit, {once:true});
  title.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); title.blur(); } }, {once:true});
}

function parsedWheelTime(value) {
  const m = /^(\d{1,2})(?::(\d{2}))?(?:\s*(AM|PM))?/i.exec(value || '');
  return {hour: m ? String(Math.max(1, Math.min(12, Number(m[1]) || 12))) : '12', minute: m && m[2] ? m[2] : '00', ampm: m && m[3] ? m[3].toUpperCase() : 'PM'};
}
function openTimeWheel(name) {
  document.querySelectorAll('.clock-panel.open').forEach(p => { if (p.dataset.clockPanel !== name) p.classList.remove('open'); });
  const panel = document.querySelector(`[data-clock-panel="${name}"]`);
  const input = document.querySelector(`[name="${name}"]`);
  if (!panel || !input) return;
  const selected = parsedWheelTime(input.value);
  panel.dataset.hour = selected.hour;
  panel.dataset.minute = selected.minute;
  panel.dataset.ampm = selected.ampm;
  syncTimeWheel(panel);
  panel.classList.toggle('open');
}
function chooseTimePart(button) {
  const panel = button.closest('[data-clock-panel]');
  if (!panel) return;
  panel.dataset[button.dataset.timePart] = button.dataset.value;
  syncTimeWheel(panel);
  const input = document.querySelector(`[name="${panel.dataset.clockPanel}"]`);
  if (!input) return;
  const h = panel.dataset.hour || '12';
  const m = panel.dataset.minute || '00';
  const ap = panel.dataset.ampm || 'PM';
  input.value = `${h}:${m} ${ap}`;
  input.dispatchEvent(new Event('change', {bubbles:true}));
  autoSaveSelectedSlot(false);
}
function syncTimeWheel(panel) {
  panel.querySelectorAll('[data-time-part]').forEach(btn => btn.classList.toggle('active', panel.dataset[btn.dataset.timePart] === btn.dataset.value));
}

function minutesFromTime(value) { const m = /^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/.exec(value || ''); if (!m) return null; let h = Number(m[1]); if (m[3]) { h = h % 12; if (m[3] === 'PM') h += 12; } return h * 60 + Number(m[2]); }
function slotTooShort(fromValue, toValue) { const from = minutesFromTime(normalizeSlotTime(fromValue)); const to = minutesFromTime(normalizeSlotTime(toValue)); return from !== null && to !== null && to > from && (to - from) < 60; }
function normalizeSlotTime(value) { if (/^\d{1,2}:\d{2}(?:\s*(AM|PM))?$/.test(value || '')) return value; return value || '0:00'; }
function checkTimelineDuration() { const form = document.querySelector('#timeline-form'); const warning = document.querySelector('.warning'); if (!form || !warning) return false; const short = slotTooShort(form.from.value, form.to.value); warning.classList.toggle('show', short); state.shortSlots = state.shortSlots.filter(i => i !== state.selectedSlot); if (short) state.shortSlots.push(state.selectedSlot); const activeSlot = document.querySelector(`.slot[data-slot="${state.selectedSlot}"]`); if (activeSlot && form.from.value && form.to.value) { activeSlot.classList.toggle('slot-bad', short); activeSlot.classList.toggle('slot-complete', !short); activeSlot.classList.remove('slot-empty'); activeSlot.querySelector('.slot-time span:first-child').textContent = displayCardTime(form.from.value); activeSlot.querySelector('.slot-time span:last-child').textContent = displayCardTime(form.to.value); } return short; }
function autoSaveSelectedSlot(updateCard = true) {
  const form = document.querySelector('#timeline-form');
  if (!form) return;
  const slot = selectedTimelineSlot();
  slot[0] = form.from.value || slot[0];
  slot[1] = form.to.value || slot[1];
  const titleText = document.querySelector('.editor-title-text')?.textContent?.trim();
  slot[2] = (titleText || slot[2]).toUpperCase();
  const loc = collectLocationFromForm(form);
  if (loc.name || loc.address1) {
    slot[6] = loc;
    rememberLocation(loc);
  }
  const location = loc.saved ? fullLocationText(loc) : (loc.name || loc.address1 || '');
  slot[3] = location ? `${slot[0]} - ${slot[1]} | ${location}` : 'Time range';
  slot[4] = form.note.value || '';
  const short = checkTimelineDuration();
  state.shortSlots = state.shortSlots.filter(i => i !== state.selectedSlot);
  if (short) state.shortSlots.push(state.selectedSlot);
  if (updateCard) updateSelectedSlotCard();
}
function updateSelectedSlotCard() {
  const activeSlot = document.querySelector(`.slot[data-slot="${state.selectedSlot}"]`);
  const slot = selectedTimelineSlot();
  if (!activeSlot || !slot) return;
  activeSlot.querySelector('.slot-time span:first-child').textContent = displayCardTime(slot[0]);
  activeSlot.querySelector('.slot-time span:last-child').textContent = displayCardTime(slot[1]);
  activeSlot.querySelector('.slot-main h3').textContent = slot[2];
  const main = activeSlot.querySelector('.slot-main');
  const ps = main.querySelectorAll('p');
  if (ps[0]) ps[0].textContent = slotCardDetail(slot);
  let note = main.querySelector('.slot-note');
  if (slot[4]) {
    if (!note) { note = document.createElement('p'); note.className = 'slot-note'; main.appendChild(note); }
    note.textContent = slot[4];
  } else if (note) note.remove();
}

function collectLocationFromForm(form) {
  const existing = slotLocation(selectedTimelineSlot()) || {};
  const saved = existing.saved && form.place.value === fullLocationText(existing);
  return {
    name: saved ? existing.name : (form.place.value || '').trim(),
    address1: saved ? existing.address1 : (form.address1?.value || '').trim(),
    address2: saved ? existing.address2 : (form.address2?.value || '').trim(),
    city: saved ? existing.city : (form.city?.value || '').trim(),
    state: saved ? existing.state : (form.state?.value || '').trim(),
    zip: saved ? existing.zip : (form.zip?.value || '').trim(),
    saved
  };
}
function rememberLocation(loc) {
  if (!loc || !loc.name || !loc.address1 || loc.name.length < 2 || loc.address1.length < 4) return;
  const nameKey = loc.name.trim().toLowerCase();
  const existingIndex = state.savedLocations.findIndex(item => item.name.trim().toLowerCase() === nameKey);
  const clean = {...loc, saved:false};
  if (existingIndex >= 0) state.savedLocations[existingIndex] = clean;
  else state.savedLocations.push(clean);
}
function selectSavedLocation(index) {
  const loc = state.savedLocations[index];
  if (!loc) return;
  const slot = selectedTimelineSlot();
  const savedLoc = {...loc, saved:true};
  const full = fullLocationText(savedLoc);
  slot[6] = savedLoc;
  slot[3] = `${slot[0]} - ${slot[1]} | ${full}`;
  state.locationPopup = false;
  state.suppressLocationPopup = true;
  render();
  const input = document.querySelector('[data-place-name]');
  if (input) { input.value = full; input.title = full; input.scrollLeft = 0; }
}


function saveSelectedSlot() { autoSaveSelectedSlot(false); render(); }


function familyArrangementValue(value) {
  const text = String(value || '');
  return text.trim() ? text : '1. ';
}
function ensureFirstFamilyNumber(textarea) {
  if (!textarea || !textarea.classList.contains('family-arrangements-input')) return;
  if (textarea.value.startsWith('1. ')) return;
  const start = textarea.selectionStart || 0;
  if (!textarea.value.trim()) {
    textarea.value = '1. ';
    textarea.setSelectionRange(3, 3);
    return;
  }
  textarea.value = textarea.value.replace(/^\s*(?:\d+\.\s*)?/, '1. ');
  textarea.setSelectionRange(Math.max(3, start), Math.max(3, start));
}
function handleFamilyArrangementKeydown(e) {
  const textarea = e.target;
  if (!textarea.classList.contains('family-arrangements-input') || e.key !== 'Enter') return;
  e.preventDefault();
  ensureFirstFamilyNumber(textarea);
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const nextNumber = textarea.value.slice(0, start).split('\n').length + 1;
  const insert = `\n${nextNumber}. `;
  textarea.value = textarea.value.slice(0, start) + insert + textarea.value.slice(end);
  const pos = start + insert.length;
  textarea.setSelectionRange(pos, pos);
  autoGrowTextarea(textarea);
  autoSaveSelectedSlot(true);
}

function autoGrowTextarea(el) {
  if (!el || el.tagName !== 'TEXTAREA' || !el.classList.contains('family-arrangements-input')) return;
  el.style.setProperty('height', 'auto', 'important');
  el.style.setProperty('height', `${Math.max(86, el.scrollHeight)}px`, 'important');
  adjustFamilyEditorHeight(el);
}
function adjustFamilyEditorHeight(el) {
  const editor = el.closest('.family-editor');
  if (!editor) return;
  const form = editor.querySelector('#timeline-form');
  const actions = editor.querySelector('.editor-actions');
  const needed = Math.max(700, el.offsetTop + el.offsetHeight + 54);
  editor.style.setProperty('height', `${needed}px`, 'important');
  if (actions) actions.style.setProperty('top', `${needed + 24}px`, 'important');
}



function googlePlacesKey() {
  return window.LEIMAGE_GOOGLE_MAPS_API_KEY || document.querySelector('meta[name="google-maps-api-key"]')?.content || localStorage.getItem('leimage-google-maps-api-key') || '';
}
function ensureGooglePlacesLoaded(callback) {
  if (window.google?.maps?.places) { callback(); return; }
  const key = googlePlacesKey();
  if (!key || state.googlePlacesLoading) return;
  state.googlePlacesLoading = true;
  window.initLeImagePlaces = () => { state.googlePlacesReady = true; callback(); };
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&callback=initLeImagePlaces`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}
function initGooglePlacesAutocomplete() {
  const input = document.querySelector('[data-place-name]');
  if (!input || input.dataset.googlePlacesAttached === '1') return;
  ensureGooglePlacesLoaded(() => {
    const freshInput = document.querySelector('[data-place-name]');
    if (!freshInput || freshInput.dataset.googlePlacesAttached === '1') return;
    const autocomplete = new google.maps.places.Autocomplete(freshInput, {
      fields: ['name', 'formatted_address', 'address_components'],
      types: ['establishment', 'geocode'],
      componentRestrictions: { country: 'us' }
    });
    freshInput.dataset.googlePlacesAttached = '1';
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      applyGooglePlace(place);
    });
  });
}
function placeComponent(place, type) {
  return place?.address_components?.find(c => c.types.includes(type))?.long_name || '';
}
function applyGooglePlace(place) {
  const form = document.querySelector('#timeline-form');
  if (!form || !place) return;
  const streetNumber = placeComponent(place, 'street_number');
  const route = placeComponent(place, 'route');
  const city = placeComponent(place, 'locality') || placeComponent(place, 'sublocality') || placeComponent(place, 'postal_town');
  const stateValue = place?.address_components?.find(c => c.types.includes('administrative_area_level_1'))?.short_name || placeComponent(place, 'administrative_area_level_1');
  const zip = placeComponent(place, 'postal_code');
  const address1 = [streetNumber, route].filter(Boolean).join(' ') || place.formatted_address || '';
  const name = place.name || place.formatted_address || form.place.value;
  form.place.value = name;
  form.address1.value = address1;
  form.city.value = city;
  if (form.state) form.state.value = stateValue;
  form.zip.value = zip;
  document.querySelectorAll('.location-address-fields').forEach(el => { el.classList.remove('is-hidden'); el.style.removeProperty('display'); });
  updateAddress2Placeholder();
  state.locationPopup = false;
  autoSaveSelectedSlot(true);
}

function updateAddress2Placeholder() {
  const form = document.querySelector('#timeline-form');
  if (!form?.address2 || !form?.place) return;
  form.address2.placeholder = /hotel/i.test(form.place.value) ? 'Room number' : 'Address 2';
}


function attachSavedLocationHandlers(root = document) {
  root.querySelectorAll('[data-saved-location]').forEach(b => {
    if (b.dataset.boundSavedLocation === '1') return;
    b.dataset.boundSavedLocation = '1';
    const choose = e => { e.preventDefault(); e.stopPropagation(); selectSavedLocation(Number(b.dataset.savedLocation)); };
    b.addEventListener('pointerdown', choose);
    b.addEventListener('click', choose);
  });
}
function showSavedLocationDropdown(input) {
  document.querySelector('.saved-location-dropdown')?.remove();
  if (!input || !state.savedLocations.length) return;
  state.locationQuery = input.value.trim();
  const matches = savedLocationMatches(state.locationQuery);
  if (!matches.length) return;
  const box = document.createElement('div');
  box.className = 'saved-location-dropdown';
  box.innerHTML = matches.map(({loc, index}) => `<button type="button" data-saved-location="${index}"><strong>${loc.name}</strong><span>${fullLocationText(loc)}</span></button>`).join('');
  input.insertAdjacentElement('afterend', box);
  attachSavedLocationHandlers(box);
}
function openSavedLocationDropdown(e) {
  if (state.suppressLocationPopup) { state.suppressLocationPopup = false; return; }
  showSavedLocationDropdown(e.currentTarget);
  initGooglePlacesAutocomplete();
}

function handleLocationTyping(e) {
  const loc = slotLocation(selectedTimelineSlot());
  updateAddress2Placeholder();
  state.locationQuery = e.target.value.trim();
  showSavedLocationDropdown(e.target);
  const typedDifferentFromSaved = !loc?.saved || e.target.value !== fullLocationText(loc);
  if (!typedDifferentFromSaved) return;
  if (loc) loc.saved = false;
  document.querySelectorAll('.location-address-fields').forEach(el => { el.classList.remove('is-hidden'); el.style.removeProperty('display'); });
}

function fillSuggestedAddress(e) { const map = {'The Plaza Hotel':['768 5th Ave','New York','NY','10019'],'Brooklyn Botanic Garden':['990 Washington Ave','Brooklyn','NY','11225'],'The River Cafe':['1 Water St','Brooklyn','NY','11201'],'501 Union':['501 Union St','Brooklyn','NY','11231']}; const hit = map[e.target.value]; const form = document.querySelector('#timeline-form'); if (!hit || !form) return; form.address1.value = hit[0]; form.city.value = hit[1]; if (form.state) form.state.value = hit[2]; form.zip.value = hit[3]; }

function closeClockPanels(e) { if (!e.target.closest('.time-control')) document.querySelectorAll('.clock-panel.open').forEach(p => p.classList.remove('open')); if (state.linkPopup && !e.target.closest('.link-popover') && !e.target.closest('[data-link-team]')) { state.linkPopup = false; render(); } if (state.addCardPopup && !e.target.closest('.add-card-popover') && !e.target.closest('[data-add-slot]')) { state.addCardPopup = false; render(); } if (state.customSlotNamePopup && !e.target.closest('.custom-slot-popover') && !e.target.closest('[data-custom-card]')) { state.customSlotNamePopup = false; render(); } if (state.locationPopup && !e.target.closest('.location-name-label')) { state.locationPopup = false; render(); } }
window.addEventListener('click', closeClockPanels);
