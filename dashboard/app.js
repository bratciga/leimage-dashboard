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
  teamMembers: ['Photographer'],
  shortSlots: [],
  vendors: [
    ['Wedding planner', 'Bride and blossom', 'www.brideandblossom.com', 'info@brideandblossom.com'],
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
const routes = ['home', 'vendors', 'timeline', 'payments', 'faq', 'contact'];
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
if (params.get('preview') === '1') {
  state.loggedIn = true;
  state.route = params.get('route') || state.route;
  if (params.has('team') && state.teamMembers[Number(params.get('team'))]) state.timelineMode = `team-${params.get('team')}`;
  if (params.has('clock')) setTimeout(() => openTimeWheel(params.get('clock')), 0);
}
syncActiveTimeline();

function fit() {
  // Match the supplied 2549px wide design canvas. Scale by width only so the
  // dashboard keeps the same proportions as the PNG and scrolls vertically if needed.
  const scale = window.innerWidth / 2549;
  document.documentElement.style.setProperty('--scale', Math.max(scale, 0.2));
}
window.addEventListener('resize', fit);
fit();

function render() {
  document.body.className = `body-${screenName()}`;
  document.documentElement.style.background = screenName() === 'home' ? '#2f3133' : '#ebf5fd';
  if (!state.loggedIn) app.innerHTML = box(signIn());
  else if (state.route === 'home') app.innerHTML = box(home());
  else app.innerHTML = box(shell(content(state.route)));
  bind();
}
function screenName() {
  if (!state.loggedIn) return 'signin';
  return state.route || 'home';
}
function box(html) { return `<div class="fit-box screen-${screenName()}"><section class="artboard screen-${screenName()}">${html}</section></div>`; }

function signIn() {
  return `<section class="signin">
    <div class="abs sign-title">weddingdashboard</div>
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

function side() {
  return `<aside class="abs side"><nav class="abs side-nav">
    ${nav('home','wedding info')}${nav('vendors','vendors')}${nav('timeline','timeline')}${nav('payments','payments')}${nav('faq','FAQ')}${nav('contact','contact us')}
  </nav></aside>`;
}
function nav(route, label) { return `<button class="${state.route === route ? 'active' : ''}" data-route="${route}">${label}</button>`; }
function shell(inner) { return `<section class="dashboard-page ${state.menuOpen ? 'menu-open' : ''}"><button class="abs menu-toggle" aria-label="Open menu" data-menu-toggle><span></span><span></span><span></span></button>${side()}<h1 class="abs page-heading">${pageTitle()}</h1><div class="abs content">${inner}</div></section>`; }
function pageTitle() { return ({payments:'Billing', vendors:'Wedding vendors', timeline:'Wedding timeline', faq:'FAQ', contact:'Contact us'})[state.route] || 'Wedding details'; }

function home() {
  return `<section class="home">
    <aside class="abs home-left"><div class="logo-box">LI</div><h1>Your settings</h1><p>Please take moment to review your wedding information and package details.</p><div class="settings">wedding info</div><nav class="home-menu">${['Wedding details','Wedding vendors','Wedding timeline','photo book','Engagement gallery','Design your album','payments','Billing','FAQ','Contact us'].map(label => `<button data-route="${routeFromLabel(label)}">${label}</button>`).join('')}</nav></aside>
    <h1 class="abs client-name">Rachel and Michael Silvermans</h1>
    <article class="abs welcome"><h2>Welcome</h2><p>Thank you for allowing Le Image to share in your big day, we are truly honored!</p><p>As you know there is a lot of preparation that goes into planning a wedding! We are here to help and have set up this app to help you organize and manage the photography and/or video aspects of your wedding. There is a drop down menu at the top right hand corner of each section to help you navigate the app.</p><button class="blue-btn contract">DOWNLOAD YOUR CONTRACT</button></article>
    <article class="abs package"><h2>Your wedding package</h2><p>2 Photographers/1 Videographer 8hr photo/video shoot with full HD camera<br>Fully edited video – Traditional Style Color Corrected Images (average of 1000 images)<br>Online photo gallery store<br>Wedding Website – fully customizable<br>All high-res photos/video on DVD<br>Raw video footage on DVD<br>Full printing rights to images</p><p>Your current balance is $1800.00 due in full by September 28, 2014. Balance includes a 3% credit card fee.</p></article>
    ${tile('tile-pay','Payments','Your current balance is $1800.00 due in full by September 28, 2014.','payments')}
    ${tile('tile-vendors','Wedding vendors','Coordinating with all parties involved helps us to provide you with the best photos/video possible, please take a moment to fill out the contact info for your vendors.','vendors')}
    ${tile('tile-timeline','Weeding timeline','The timeline will serve as a guideline for our photographers/videographers on your wedding day. Please be sure to read our suggestions for each section and assign the time accordingly.','timeline')}
    ${tile('tile-book','Photo book','Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.','photobook')}
  </section>`;
}
function routeFromLabel(label) { const l=label.toLowerCase(); if(l.includes('vendor')) return 'vendors'; if(l.includes('timeline')) return 'timeline'; if(l.includes('payment')||l.includes('billing')) return 'payments'; if(l.includes('faq')) return 'faq'; if(l.includes('contact')) return 'contact'; return 'home'; }
function tile(cls, title, copy, route) { return `<article class="abs tile ${cls}"><h3>${title}</h3><p>${copy}</p><button class="plain-btn" data-route="${route}">view</button></article>`; }

function content(route) {
  if (route === 'payments') return payments();
  if (route === 'vendors') return vendors();
  if (route === 'timeline') return timeline();
  if (route === 'faq') return faq();
  return `<article class="card" style="left:0;top:0;width:760px;height:260px;padding:50px"><h2>Contact us</h2><p>Call us at 718.971.9710</p></article>`;
}
function payments() {
  return `<article class="card pay-total"><h2>TOTAL</h2><div class="big-money">$2,860,00</div><div class="due-money">$860,00</div><p>Outstanding balance<br>Due September 18</p><button class="blue-btn pay-btn">make payment</button></article>
  <article class="card pay-history"><h2>Payment history</h2><p>Here you can find your prveious payments, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore.</p><table class="payment-table"><thead><tr><th>AMOUNT</th><th>DATE</th><th>METHOD</th></tr></thead><tbody><tr><td>$1,000.00</td><td>Sep 16, 2016</td><td>Check</td></tr><tr><td>$500.00</td><td>Dec 22, 2016</td><td>Online</td></tr><tr><td>$500.00</td><td>Dec 23, 2016</td><td>Check</td></tr></tbody></table></article>
  <article class="card pay-form"><h2>Make a payment</h2><div class="form-grid"><div class="form-full"><span class="field-label">Choose your payment method</span><div class="card-radio">Credit card<span>All transactions are secure and encrypted.</span></div></div>${['First name','Last name','Credit card number','Month','Year','CVV','Address 1','Address 2','City','Zip code','State','Country'].map((x,i)=>field(x, i===2?'form-wide':'')).join('')}<div class="form-full">${field('Choose your payment amount','', '$50,00')}<span class="field-label">Enter payment amount here</span></div><button class="blue-btn pay-btn">make payment</button></div></article>`;
}
function field(label, cls='', value='') { return `<label class="${cls}"><span class="field-label">${label}</span><input class="input" value="${value}"></label>`; }

function vendors() {
  return `<article class="card vendor-info"><h2>Your vendors</h2><p>Coordinating with all parties involved helps us to provide you with the best photos/video possible, please take a moment to fill out the contact info for the following vendors.</p><button class="blue-btn vendor-submit">SUBMIT VENDORS LIST</button></article><section class="abs vendor-list">${state.vendors.map(v => `<article class="vendor-card"><h3>${v[0]}</h3><div class="vendor-fields">${field('Name','',v[1])}${field('Website','',v[2])}${field('Email','',v[3])}</div></article>`).join('')}</section>`;
}
function timeline() {
  syncActiveTimeline();
  const activeIndex = activeTeamIndex();
  const modeLabel = `${state.teamMembers[activeIndex] || 'Photographer'} Timeline`;
  const teamButtons = state.teamMembers.map((member, index) => `<div class="timeline-option team-member ${index === 0 ? 'primary-team-member' : ''}"><button class="${state.timelineMode === `team-${index}` ? 'active' : ''}" data-timeline-mode="team-${index}"><span>${member}</span>${index > 0 ? '<span class="link-timeline" aria-label="Link team member timeline" data-link-team="'+index+'">🔗</span>' : ''}</button></div>`).join('');
  return `<article class="card timeline-info"><h2>Wedding timeline info</h2><p>This timeline will serve as a guideline for our photographers/videographers on your wedding day. Our photographers are great at what they do, however it takes time to create the beautiful shots you see in our wedding photography. Be sure to remember to allow extra time for traveling between venues/locations, wedding party member delays, traffic etc. We have shot tons of weddings and in our experience even the most well planned wedding always has unexpected delays. Therefore we ask that you allot extra time to each category just in case! Please be sure to read our suggestions for each section and assign the time accordingly. If you have more than one photographer or videographer be sure to fill out the info for the “Second Timeline” as well.</p></article>
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
function faq() { return `<aside class="abs faq-help"><h2>Got questions?</h2><p>Hopefully this will help, but if there’s anything else you want to ask us about, call us at 718.971.9710</p></aside><section class="abs faq-content">${faqSection('Your contract', [['Where can I find my contract?', 'The copy of your contract is located on Wedding info tab.'], ['There are parts of my contract I don’t understand, what do I do?', 'Give us a call at the studio for clarification']])}${faqSection('Payments', [['How do I make a payment or see my current balance?', 'Click on the Payments/Billing Tab and your current balance will be listed'], ['When is my final payment due?', 'Your final payment is due 14 days prior to your wedding'], ['What are my payment options?', 'We accept card, check, money order and cash, however you can only use this app for payments with cards. For other methods of payment contact our studio directly.'], ['Why is the total balance higher than the price listed on your website?', 'The prices on our website do not include NY State sales tax and/or any applicable fees.']])}</section>`; }
function faqSection(title, items) { return `<section class="faq-section"><h2>${title}</h2>${items.map(i=>`<article class="faq-item"><h3>${i[0]}</h3><p>${i[1]}</p></article>`).join('')}</section>`; }

function bind() {
  document.querySelector('#signin-form')?.addEventListener('submit', e => { e.preventDefault(); state.loggedIn = true; sessionStorage.setItem('wedding-dashboard-auth','1'); state.route='home'; location.hash='home'; render(); });
  document.querySelector('[data-menu-toggle]')?.addEventListener('click', () => { state.menuOpen = !state.menuOpen; render(); });
  document.querySelectorAll('[data-route]').forEach(b => b.addEventListener('click', () => { state.route=b.dataset.route; state.menuOpen=false; location.hash=state.route; render(); }));
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
