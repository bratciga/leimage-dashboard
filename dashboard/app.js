const state = {
  loggedIn: sessionStorage.getItem('wedding-dashboard-auth') === '1',
  route: location.hash.replace('#', '') || 'home',
  menuOpen: false,
  vendors: [
    ['Wedding planner', 'Bride and blossom', 'www.brideandblossom.com', 'info@brideandblossom.com'],
    ['Florist', '', '', ''],
    ['DJ/Band', '', '', 'DJ/Bands email'],
    ['Officiant/Reverend', '', 'Officiant/Reverends website', ''],
    ['Hair/Makeup', '', 'Hair/Makeup website', '']
  ],
  timeline: [
    ['1:45', '2:15', 'GETTING READY - SPOUSE 1', '1:45PM - 2:15PM | Our house', 'NOTE', true],
    ['2:20', '2:40', 'FIRST LOOK AND PICTURES AT VENUE', 'Please define time', '', false],
    ['0:00', '0:00', 'CEREMONY', 'Please define time', '', false],
    ['0:00', '0:00', 'COCKTAIL HOUR', 'details', '', false],
    ['0:00', '0:00', 'RECEPTION', 'Please define time', '', false],
    ['0:00', '0:00', 'PHOTOGRAPHER LEAVE', 'Please define time', '', false]
  ]
};

const app = document.querySelector('#app');
const routes = ['home', 'vendors', 'timeline', 'payments', 'faq', 'contact'];
const params = new URLSearchParams(location.search);
if (params.get('preview') === '1') {
  state.loggedIn = true;
  state.route = params.get('route') || state.route;
}

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
  return `<article class="card timeline-info"><h2>Wedding timeline info</h2><p>This timeline will serve as a guideline for our photographers/videographers on your wedding day. Our photographers are great at what they do, however it takes time to create the beautiful shots you see in our wedding photography. Be sure to remember to allow extra time for traveling between venues/locations, wedding party member delays, traffic etc. We have shot tons of weddings and in our experience even the most well planned wedding always has unexpected delays. Therefore we ask that you allot extra time to each category just in case! Please be sure to read our suggestions for each section and assign the time accordingly. If you have more than one photographer or videographer be sure to fill out the info for the “Second Timeline” as well.</p></article>
  <nav class="abs timeline-sections"><button>Photographer</button><button>Videographer</button><button>Submit The Timeline</button></nav>
  <div class="abs timeline-list-head"><span>Photographer Timeline</span><button class="add-slot" aria-label="Add another time slot" data-add-slot>+</button></div><section class="abs slots">${state.timeline.map(slot).join('')}</section>${editor()}`;
}
function slot(s, i) { return `<article class="slot"><div class="abs slot-time">${s[0]}<br>${s[1]}</div><div class="abs slot-main"><h3>${s[2]}</h3><p>${s[3]}</p>${s[4]?`<p>${s[4]}</p>`:''}</div><div class="abs slot-actions">${s[5]?'<button class="details-btn">details</button>':''}</div></article>`; }
function timeOptions() { return ['07:00 AM','07:15 AM','07:30 AM','07:45 AM','08:00 AM','08:15 AM','08:30 AM','08:45 AM','09:00 AM','09:15 AM','09:30 AM','09:45 AM','10:00 AM','10:15 AM','10:30 AM','10:45 AM','11:00 AM','11:15 AM','11:30 AM','11:45 AM','12:00 PM'].map(t => `<option value="${t}">${t}</option>`).join(''); }
function editor() { return `<aside class="abs editor"><h2>Detailed timeslot</h2><div class="warning" role="alert">You have selected less time than recommended</div><div class="note-box"><strong>NOTE</strong><p>Our photographer will capture your getting ready photos, which will include your dress, shoes, details. Please be sure to have your invitations, rings, bouquet and anything else you would like photographed set aside for our team. We recommend at least 1 hour total for getting ready.</p></div><form id="timeline-form"><label><span class="field-label">Getting ready - spouse 1</span><input class="input" name="title"></label><label><span class="field-label">Define time</span><div class="time-picker"><span>From</span><select class="input" name="from"><option value="">Set time</option>${timeOptions()}</select><span>To</span><select class="input" name="to"><option value="">Set time</option>${timeOptions()}</select></div></label><label><span class="field-label">Location name</span><input class="input" name="place" placeholder="Restaurant, home address"></label><label><span class="field-label">Location address</span><div class="address-grid"><input class="input" placeholder="Address 1"><input class="input" placeholder="Address 2"></div></label><div class="address-grid"><label><span class="field-label">City</span><input class="input"></label><label><span class="field-label">Zip code</span><input class="input"></label></div><label><span class="field-label">Additional notes</span><textarea class="input" name="note" placeholder="Please write if there is anything else you want us to know"></textarea></label><div class="editor-actions"><button type="button" class="delete">delete timeslot</button><span>or</span><button type="button" class="blue-btn save-btn">Save changes</button></div></form></aside>`; }
function faq() { return `<aside class="abs faq-help"><h2>Got questions?</h2><p>Hopefully this will help, but if there’s anything else you want to ask us about, call us at 718.971.9710</p></aside><section class="abs faq-content">${faqSection('Your contract', [['Where can I find my contract?', 'The copy of your contract is located on Wedding info tab.'], ['There are parts of my contract I don’t understand, what do I do?', 'Give us a call at the studio for clarification']])}${faqSection('Payments', [['How do I make a payment or see my current balance?', 'Click on the Payments/Billing Tab and your current balance will be listed'], ['When is my final payment due?', 'Your final payment is due 14 days prior to your wedding'], ['What are my payment options?', 'We accept card, check, money order and cash, however you can only use this app for payments with cards. For other methods of payment contact our studio directly.'], ['Why is the total balance higher than the price listed on your website?', 'The prices on our website do not include NY State sales tax and/or any applicable fees.']])}</section>`; }
function faqSection(title, items) { return `<section class="faq-section"><h2>${title}</h2>${items.map(i=>`<article class="faq-item"><h3>${i[0]}</h3><p>${i[1]}</p></article>`).join('')}</section>`; }

function bind() {
  document.querySelector('#signin-form')?.addEventListener('submit', e => { e.preventDefault(); state.loggedIn = true; sessionStorage.setItem('wedding-dashboard-auth','1'); state.route='home'; location.hash='home'; render(); });
  document.querySelector('[data-menu-toggle]')?.addEventListener('click', () => { state.menuOpen = !state.menuOpen; render(); });
  document.querySelectorAll('[data-route]').forEach(b => b.addEventListener('click', () => { state.route=b.dataset.route; state.menuOpen=false; location.hash=state.route; render(); }));
  document.querySelector('[data-add-slot]')?.addEventListener('click', () => { state.timeline.push(['0:00', '0:00', 'NEW TIMESLOT', 'Please define time', '', false]); render(); });
  document.querySelectorAll('[data-delete-time]').forEach(b => b.addEventListener('click', () => { state.timeline.splice(Number(b.dataset.deleteTime),1); render(); }));
  document.querySelectorAll('#timeline-form select').forEach(s => s.addEventListener('change', checkTimelineDuration));
  document.querySelector('#timeline-form')?.addEventListener('submit', e => { e.preventDefault(); });
  document.querySelector('.save-btn')?.addEventListener('click', e => { e.preventDefault(); checkTimelineDuration(); });
}
window.addEventListener('hashchange', () => { const r=location.hash.replace('#','') || 'home'; if (state.loggedIn && routes.includes(r) && r!==state.route) { state.route=r; render(); }});
render();

function minutesFromTime(value) { const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/.exec(value || ''); if (!m) return null; let h = Number(m[1]) % 12; if (m[3] === 'PM') h += 12; return h * 60 + Number(m[2]); }
function checkTimelineDuration() { const form = document.querySelector('#timeline-form'); const warning = document.querySelector('.warning'); if (!form || !warning) return; const from = minutesFromTime(form.from.value); const to = minutesFromTime(form.to.value); warning.classList.toggle('show', from !== null && to !== null && to > from && (to - from) < 60); }
