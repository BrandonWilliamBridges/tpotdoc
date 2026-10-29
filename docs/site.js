// Contact form: sends to Yv'e's inbox through FormSubmit (formsubmit.co). The address is assembled here
  // rather than written out in the page, so spam bots scanning the HTML don't pick it up.
  // info@tpotdoc.com forwards (Cloudflare Email Routing) to Yv'e and anyone she adds as a helper.
  var INBOX = ['info', 'tpotdoc.com'].join('@');
  var askForm = document.getElementById('ask-form');
  var bibleAddress = document.getElementById('bible-address');
  if (askForm) askForm.querySelectorAll('input[name=bible]').forEach(function (r) {
    r.addEventListener('change', function () { bibleAddress.hidden = askForm.elements.bible.value !== 'need'; });
  });
  if (askForm) askForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = askForm.elements;
    var err = document.getElementById('ask-error');
    var send = document.getElementById('ask-send');
    var kind = f.kind.value === 'prayer' ? 'Prayer request' : 'Question';
    var email = f.email.value.trim();
    var message = f.message.value.trim();
    var needsBible = f.bible.value === 'need';
    var addr = ['fullname', 'street', 'city', 'state', 'zip'].map(function (k) { return f[k].value.trim(); });
    err.hidden = true;
    if (needsBible) {
      var missing = ['fullname', 'street', 'city', 'state', 'zip'].filter(function (k, i) { return !addr[i]; })[0];
      if (missing) { err.textContent = 'Please fill in your full mailing address so Yv\'e can send your Bible.'; err.hidden = false; f[missing].focus(); return; }
      if (!/^\d{5}(-\d{4})?$/.test(addr[4])) { err.textContent = 'Please check your ZIP code. It should be 5 digits.'; err.hidden = false; f.zip.focus(); return; }
    }
    if (!message && !needsBible) { err.textContent = 'Please write your message before sending.'; err.hidden = false; f.message.focus(); return; }
    var wantsReply = f.contact.value === 'yes';
    if (wantsReply && !email) { err.textContent = 'Please add your email so Yv\'e can reply, or choose “No reply needed.”'; err.hidden = false; f.email.focus(); return; }
    if (email && !f.email.checkValidity()) { err.textContent = 'That email address doesn\'t look complete. Please check it.'; err.hidden = false; f.email.focus(); return; }
    if (f._honey.value) return;
    var name = f.name.value.trim() || 'Someone';
    var payload = {
      _subject: 'TPOT DOC ' + kind.toLowerCase() + ' from ' + name + ' (' + f.topic.value + ')',
      _template: 'table',
      _captcha: 'false',
      'Type': kind,
      'Name': name,
      'Email': email || '(not given)',
      'Contact me': wantsReply ? 'Yes, please reply' : 'No reply needed',
      'Topic': f.topic.value,
      'Message': message || '(no message)',
      'Bible': needsBible ? 'Needs a Bible' : (f.bible.value === 'have' ? 'Has a Bible' : '(not answered)'),
      'Sent from': location.href
    };
    if (needsBible) {
      payload._subject += ' + free Bible request';
      payload['Mail Bible to'] = addr[0] + ', ' + addr[1] + ', ' + addr[2] + ', ' + addr[3].toUpperCase() + ' ' + addr[4];
    }
    if (email && wantsReply) payload._replyto = email;
    send.disabled = true; send.textContent = 'Sending…';
    fetch('https://formsubmit.co/ajax/' + INBOX, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json().then(function (d) { if (!r.ok || String(d.success) !== 'true') throw new Error(d.message || 'failed'); }); })
      .then(function () {
        askForm.querySelectorAll('input:not([type=radio]), textarea').forEach(function (el) { el.value = ''; });
        document.getElementById('ask-thanks').hidden = false;
        if (needsBible) document.getElementById('ask-thanks').insertAdjacentHTML('beforeend', ' Your Bible request is in, and Yv\'e will mail it to the address you gave.');
        send.textContent = 'Sent';
      })
      .catch(function () {
        err.textContent = 'Your message didn\'t go through. Please check your connection and try again in a minute.';
        err.hidden = false;
        send.disabled = false; send.textContent = 'Send message';
      });
  });

  var faqSearch = document.getElementById('faq-q');
  if (faqSearch) faqSearch.addEventListener('input', function (e) {
    var q = e.target.value.trim().toLowerCase();
    var shown = 0;
    document.querySelectorAll('#faq-list .faq-item').forEach(function (item) {
      var hit = !q || item.textContent.toLowerCase().indexOf(q) !== -1;
      item.hidden = !hit;
      if (hit) shown++;
    });
    document.getElementById('faq-empty').hidden = shown > 0;
  });
