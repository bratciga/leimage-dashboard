const state = {
  loggedIn: sessionStorage.getItem('wedding-dashboard-auth') === '1',
  route: location.hash.replace('#', '') || 'home',
  vendors: [
    { role: 'Wedding planner', name: 'Bride and blossom', website: 'www.brideandblossom.com', email: 'info@brideandblossom.com' },
    { role: 'Florist', name: '', website: '', email: '' },
    { role: 'DJ/Band', name: '', website: '', email: 'DJ/Bands email' },
    { role: 'Officiant/Reverend', name: '', website: 'Officiant/Reverends website', email: '' },
    { role: 'Hair/Makeup', name: '', website: 'Hair/Makeup website', email: '' }
  ],
  timeline: [
    { from: '1:45', to: '2:15', title: 'GETTING READY - SPOUSE 1', place: 'Our house', note: 'Our photographer will capture your getting ready photos, which will include your dress, shoes, details. Please have invitations, rings, bouquet and anything else you would like photographed set aside.' },
    { from: '2:20', to: '2:40', title: 'FIRST LOOK AND PICTURES AT VENUE', place: 'Venue', note: 'First look and pictures at the venue.' },
    { from: '0:00', to: '0:00', title: 'CEREMONY', place: 'Please define time', note: 'Please define time.' },
    { from: '0:00', to: '0:00', title: 'COCKTAIL HOUR', place: 'Please define time', note: 'Details and cocktail hour coverage.' },
    { from: '0:00', to: '0:00', title: 'RECEPTION', place: 'Please define time', note: 'Reception formalities, dancing and candid coverage.' },
    { from: '0:00', to: '0:00', title: 'PHOTOGRAPHER LEAVE', place: 'Please define time', note: 'End of photography coverage.' }
  ]
};

const app = document.querySelector('#app');

function render() {
  if (!state.loggedIn) {
    app.innerHTML = signIn();
    bindSignIn();
    return;
  }
  if (state.route === 'home') app.innerHTML = home();
  else app.innerHTML = shell(pageContent(state.route));
  bindApp();
}

function signIn() {
  return `
    <main class="signin-page">
      <section class="signin-card">
        <div class="signin-copy">
          <p class="app-name">weddingdashboard</p>
          <h1>Welcome!</h1>
          <p>Lorem ipsum dolor sit amet, consectetur adipisicing</p>
        </div>
        <form class="signin-panel" id="signin-form">
          <h2>Sign in</h2>
          <div class="field"><label>Username</label><input class="input" name="username" autocomplete="username" required></div>
          <div class="field"><label>Password</label><input class="input" name="password" type="password" autocomplete="current-password" required></div>
          <button class="primary-button" type="submit">Sign in</button>
          <p class="signin-help">If you forgot your password, just contact us.</p>
        </form>
      </section>
    </main>`;
}

function home() {
  return `
    <main class="home-layout">
      <aside class="home-sidebar">
        <div class="logo-mark">LI</div>
        <h1>Your settings</h1>
        <p>Please take moment to review your wedding information and package details.</p>
        <h2 class="settings-title">wedding info</h2>
        <nav class="home-nav">
          ${homeNav('home', 'Wedding details')}
          ${homeNav('vendors', 'Wedding vendors')}
          ${homeNav('timeline', 'Wedding timeline')}
          ${homeNav('photobook', 'photo book')}
          ${homeNav('engagement', 'Engagement gallery')}
          ${homeNav('album', 'Design your album')}
          ${homeNav('payments', 'Billing')}
          ${homeNav('faq', 'FAQ')}
          ${homeNav('contact', 'Contact us')}
        </nav>
      </aside>
      <section class="home-main">
        <h1 class="client-name">Rachel and Michael Silvermans</h1>
        <div class="home-grid">
          <article class="welcome-block">
            <h2>Welcome</h2>
            <p>Thank you for allowing Le Image to share in your big day, we are truly honored!</p>
            <p>As you know there is a lot of preparation that goes into planning a wedding! We are here to help and have set up this app to help you organize and manage the photography and/or video aspects of your wedding. There is a drop down menu at the top right hand corner of each section to help you navigate the app.</p>
            <a class="contract-button" href="#contract">Download your contract</a>
          </article>
          <article class="package-block">
            <h2>Your wedding package</h2>
            <p>2 Photographers/1 Videographer 8hr photo/video shoot with full HD camera<br>Fully edited video – Traditional Style Color Corrected Images (average of 1000 images)<br>Online photo gallery store<br>Wedding Website – fully customizable<br>All high-res photos/video on DVD<br>Raw video footage on DVD<br>Full printing rights to images</p>
            <p class="balance-note">Your current balance is $1800.00 due in full by September 28, 2014. Balance includes a 3% credit card fee.</p>
          </article>
        </div>
        <section class="tiles">
          <article class="tile"><h3>Payments</h3><p>Your current balance is $1800.00 due in full by September 28, 2014.</p><button data-route="payments">view</button></article>
          <article class="tile"><h3>Wedding vendors</h3><p>Coordinating with all parties involved helps us to provide you with the best photos/video possible, please take a moment to fill out the contact info for your vendors.</p><button data-route="vendors">view</button></article>
          <article class="tile"><h3>Weeding timeline</h3><p>The timeline will serve as a guideline for our photographers/videographers on your wedding day. Please be sure to read our suggestions for each section and assign the time accordingly.</p><button data-route="timeline">view</button></article>
          <article class="tile"><h3>Photo book</h3><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt.</p><button data-route="photobook">view</button></article>
        </section>
      </section>
    </main>`;
}

function shell(content) {
  return `
    <main class="dashboard">
      <aside class="sidebar">
        <div class="logo-mark">LI</div>
        <nav class="nav">
          ${nav('home','wedding info')}
          ${nav('vendors','vendors')}
          ${nav('timeline','timeline')}
          ${nav('payments','payments')}
          ${nav('faq','FAQ')}
          ${nav('contact','contact us')}
        </nav>
        <div class="sidebar-foot"><button class="logout-button" id="logout">logout</button></div>
      </aside>
      <section class="main">${content}</section>
    </main>`;
}

function nav(route, label) { return `<button class="${state.route === route ? 'active' : ''}" data-route="${route}">${label}</button>`; }
function homeNav(route, label) { return `<button data-route="${route}">${label}</button>`; }

function pageHeader(title, copy = '') {
  return `<header class="page-title"><div><h1>${title}</h1>${copy ? `<p>${copy}</p>` : ''}</div></header>`;
}

function pageContent(route) {
  if (route === 'payments') return payments();
  if (route === 'vendors') return vendors();
  if (route === 'timeline') return timeline();
  if (route === 'faq') return faq();
  if (route === 'contact') return contact();
  return placeholder(route);
}

function payments() {
  return `${pageHeader('Billing')}
    <section class="section-grid two-col">
      <article class="card">
        <h2>TOTAL</h2>
        <p class="billing-total">$2,860.00</p>
        <p class="amount-due">$860.00</p>
        <p>Outstanding balance<br>Due September 18</p>
        <button class="primary-button">make payment</button>
      </article>
      <article class="card">
        <h2>Payment history</h2>
        <p>Here you can find your prveious payments, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore.</p>
        <table class="payment-history">
          <thead><tr><th>Amount</th><th>Date</th><th>Method</th></tr></thead>
          <tbody>
            <tr><td>$1,000.00</td><td>Sep 16, 2016</td><td>Check</td></tr>
            <tr><td>$500.00</td><td>Dec 22, 2016</td><td>Online</td></tr>
            <tr><td>$500.00</td><td>Dec 23, 2016</td><td>Check</td></tr>
          </tbody>
        </table>
      </article>
      <article class="card" style="grid-column: 1 / -1;">
        <h2>Make a payment</h2>
        <form class="payment-form">
          <div class="field wide"><label>Choose your payment method</label><div class="card-radio">Credit card <span>All transactions are secure and encrypted.</span></div></div>
          ${input('First name')} ${input('Last name')} ${input('Credit card number','wide')} ${input('Month')} ${input('Year')} ${input('CVV')} ${input('Address 1')} ${input('Address 2')} ${input('City')} ${input('Zip code')} ${input('State')} ${input('Country')}
          <div class="field wide"><label>Choose your payment amount</label><input class="input" value="$50,00"><small class="muted">Enter payment amount here</small></div>
          <button class="primary-button wide" type="button">make payment</button>
        </form>
      </article>
    </section>`;
}

function vendors() {
  return `${pageHeader('Wedding vendors')}
    <section class="section-grid two-col">
      <article class="card vendor-intro"><h2>Your vendors</h2><p>Coordinating with all parties involved helps us to provide you with the best photos/video possible, please take a moment to fill out the contact info for the following vendors.</p><button class="primary-button submit-vendors" type="button">SUBMIT VENDORS LIST</button></article>
      <div class="vendor-forms">${state.vendors.map((vendor, i) => vendorCard(vendor, i)).join('')}</div>
    </section>`;
}

function vendorCard(vendor, index) {
  return `<article class="vendor-card"><h3>${vendor.role}</h3><div class="vendor-fields">
    <div class="field"><label>Name</label><input class="input" data-vendor="${index}" data-field="name" placeholder="Full name" value="${vendor.name}"></div>
    <div class="field"><label>Website</label><input class="input" data-vendor="${index}" data-field="website" placeholder="Vendors website" value="${vendor.website}"></div>
    <div class="field"><label>Email</label><input class="input" data-vendor="${index}" data-field="email" placeholder="Email address" value="${vendor.email}"></div>
  </div></article>`;
}

function timeline() {
  return `${pageHeader('Wedding timeline')}
    <section class="timeline-info card"><h2>Wedding timeline info</h2><p>This timeline will serve as a guideline for our photographers/videographers on your wedding day. Our photographers are great at what they do, however it takes time to create the beautiful shots you see in our wedding photography. Be sure to remember to allow enough time for each section.</p></section>
    <section class="photographer-tabs"><button class="active">First photographer</button><button>Second photographer</button><button>USE FIRST PHOTOGRAPHER TIMELINE</button><button>submit all timelines as final</button></section>
    <section class="timeline-workspace">
      <div><h2 class="subhead">First photographer timeline</h2><div class="timeslots">${state.timeline.map((item, i) => `<article class="timeslot"><div class="timeslot-time">${item.from}<br>${item.to}</div><div><h3>${item.title}</h3><p>${item.from}PM - ${item.to}PM | ${item.place}</p><p>${item.note}</p></div><button class="delete-link" data-delete-time="${i}">delete timeslot</button></article>`).join('')}</div></div>
      <aside class="timeline-editor">
        <h2>Detailed timeslot</h2>
        <p class="warning">You have selected less time then recommended</p>
        <form id="timeline-form">
          <div class="field"><label>Getting ready - spouse 1</label><input class="input" name="title" placeholder="Timeslot name" required></div>
          <div class="time-row"><div class="field"><label>Define time / From</label><input class="input" name="from" placeholder="09:00 AM" required></div><div class="field"><label>To</label><input class="input" name="to" placeholder="Set time" required></div></div>
          <div class="field"><label>Location name</label><input class="input" name="place" placeholder="Restaurant, home address"></div>
          <div class="time-row"><div class="field"><label>Address 1</label><input class="input"></div><div class="field"><label>Address 2</label><input class="input"></div></div>
          <div class="time-row"><div class="field"><label>City</label><input class="input"></div><div class="field"><label>Zip code</label><input class="input"></div></div>
          <div class="field"><label>Additional notes</label><textarea class="textarea" name="note" placeholder="Please write if there is anything else you want us to know"></textarea></div>
          <button class="primary-button" type="submit">Save changes</button>
        </form>
      </aside>
    </section>`;
}

function faq() {
  const sections = [
    ['Your contract', [
      ['Where can I find my contract?', 'The copy of your contract is located on Wedding info tab.'],
      ['There are parts of my contract I don’t understand, what do I do?', 'Give us a call at the studio for clarification.']
    ]],
    ['Payments', [
      ['How do I make a payment or see my current balance?', 'Click on the Payments/Billing Tab and your current balance will be listed.'],
      ['When is my final payment due?', 'Your final payment is due 14 days prior to your wedding.'],
      ['What are my payment options?', 'We accept card, check, money order and cash. You can only use this app for card payments.'],
      ['Why is the total balance higher than the price listed on your website?', 'The prices on our website do not include NY State sales tax and/or card fees.']
    ]]
  ];
  return `${pageHeader('FAQ')}
    <section class="faq-layout"><aside class="faq-help"><h2>Got questions?</h2><p>Hopefully this will help, but if there’s anything else you want to ask us about, call us at 718.971.9710</p></aside><div>${sections.map(([title, items]) => `<section class="faq-section"><h2>${title}</h2>${items.map(([q,a]) => `<article class="faq-item"><h3>${q}</h3><p>${a}</p></article>`).join('')}</section>`).join('')}</div></section>`;
}

function contact() { return `${pageHeader('Contact us')}<article class="card"><h2>Le Image</h2><p>Call us at 718.971.9710 or email info@leimageinc.com.</p></article>`; }
function placeholder(route) { return `${pageHeader(route)}<article class="card"><h2>${route}</h2><p>This section is reserved for the next dashboard module.</p></article>`; }
function input(label, cls='') { return `<div class="field ${cls}"><label>${label}</label><input class="input"></div>`; }

function bindSignIn() {
  document.querySelector('#signin-form').addEventListener('submit', e => {
    e.preventDefault();
    state.loggedIn = true;
    sessionStorage.setItem('wedding-dashboard-auth', '1');
    state.route = 'home';
    location.hash = 'home';
    render();
  });
}

function bindApp() {
  document.querySelectorAll('[data-route]').forEach(btn => btn.addEventListener('click', () => {
    state.route = btn.dataset.route;
    location.hash = state.route;
    render();
  }));
  document.querySelector('#logout')?.addEventListener('click', () => {
    sessionStorage.removeItem('wedding-dashboard-auth');
    state.loggedIn = false;
    render();
  });
  document.querySelectorAll('[data-vendor]').forEach(input => input.addEventListener('input', () => {
    state.vendors[Number(input.dataset.vendor)][input.dataset.field] = input.value;
  }));
  document.querySelectorAll('[data-delete-time]').forEach(btn => btn.addEventListener('click', () => {
    state.timeline.splice(Number(btn.dataset.deleteTime), 1);
    render();
  }));
  document.querySelector('#timeline-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    state.timeline.push({ from: f.get('from'), to: f.get('to'), title: f.get('title'), place: f.get('place') || 'Please define time', note: f.get('note') || 'Client added timeslot.' });
    render();
  });
}

window.addEventListener('hashchange', () => {
  const route = location.hash.replace('#', '') || 'home';
  if (state.route !== route && state.loggedIn) {
    state.route = route;
    render();
  }
});

render();
