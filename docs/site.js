// Contact form: sends to Yv'e's inbox through FormSubmit (formsubmit.co). The address is assembled here
  // rather than written out in the page, so spam bots scanning the HTML don't pick it up.
  // After FormSubmit's activation email is confirmed, swap INBOX for the random alias it provides.
  var INBOX = ['markyve77', 'gmail.com'].join('@');
  var askForm = document.getElementById('ask-form');
  if (askForm) askForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = askForm.elements;
    var err = document.getElementById('ask-error');
    var send = document.getElementById('ask-send');
    var kind = f.kind.value === 'prayer' ? 'Prayer request' : 'Question';
    var email = f.email.value.trim();
    var message = f.message.value.trim();
    err.hidden = true;
    if (!message) { err.textContent = 'Please write your message before sending.'; err.hidden = false; f.message.focus(); return; }
    if (kind === 'Question' && !email) { err.textContent = 'Please add your email so Yv\'e can send you an answer.'; err.hidden = false; f.email.focus(); return; }
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
      'Topic': f.topic.value,
      'Message': message,
      'Sent from': location.href
    };
    if (email) payload._replyto = email;
    send.disabled = true; send.textContent = 'Sending…';
    fetch('https://formsubmit.co/ajax/' + INBOX, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json().then(function (d) { if (!r.ok || String(d.success) !== 'true') throw new Error(d.message || 'failed'); }); })
      .then(function () {
        askForm.querySelectorAll('input:not([type=radio]), textarea').forEach(function (el) { el.value = ''; });
        document.getElementById('ask-thanks').hidden = false;
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
