/**
 * Interactive form and chart events / logic.
 */
(function () {
  var yearEl = document.getElementById('year'),
    monthEl = document.getElementById('month'),
    dayEl = document.getElementById('day'),
    unitboxEl = document.getElementById('unitbox'),
    unitText = document.querySelector('.unitbox-label').textContent.toLowerCase(),
    items = document.querySelectorAll('.chart li'),
    chartEl = document.querySelector('.chart'),
    exportEl = document.getElementById('export-format'),
    trackerCountEl = document.getElementById('life-count'),
    trackerUnitEl = document.getElementById('life-unit'),
    trackerTotalEl = document.getElementById('life-total'),
    trackerSubEl = document.getElementById('life-sub'),
    trackerPercentEl = document.getElementById('life-percent'),
    noteToggleEl = document.getElementById('note-toggle'),
    notePanelEl = document.getElementById('note-panel'),
    noteCloseEl = document.getElementById('note-close'),
    noteTextEl = document.getElementById('note-text'),
    quoteRefreshEl = document.getElementById('quote-refresh'),
    quoteTextEl = document.getElementById('quote-text'),
    quoteAuthorEl = document.getElementById('quote-author'),
    itemCount = 0,
    KEY = {
      UP: 38,
      DOWN: 40
    };

  // Set listeners
  unitboxEl.addEventListener('change', _handleUnitChange);
  yearEl.addEventListener('input', _handleDateChange);
  yearEl.addEventListener('keydown', _handleUpdown);
  yearEl.addEventListener('blur', _unhideValidationStyles);
  monthEl.addEventListener('change', _handleDateChange);
  monthEl.addEventListener('keydown', _handleUpdown);
  dayEl.addEventListener('input', _handleDateChange);
  dayEl.addEventListener('blur', _unhideValidationStyles);
  dayEl.addEventListener('keydown', _handleUpdown);
  if (exportEl) {
    exportEl.addEventListener('change', _handleExportChange);
  }
  if (noteToggleEl) {
    noteToggleEl.addEventListener('click', _openNote);
  }
  if (noteCloseEl) {
    noteCloseEl.addEventListener('click', _closeNote);
  }
  if (noteTextEl) {
    noteTextEl.addEventListener('input', _autoResizeNote);
    noteTextEl.addEventListener('keydown', _handleNoteKeydown);
  }
  if (quoteRefreshEl) {
    quoteRefreshEl.addEventListener('click', _loadQuote);
  }

  // Ensure the month is unselected by default.
  monthEl.selectedIndex = -1;

  // Load default values
  _loadQuote();
  _loadStoredValueOfDOB();

  // Event Handlers
  function _handleUnitChange(e) {
    window.location = '' + e.currentTarget.value + '.html';
  }

  function _handleDateChange(e) {

    // Save date of birth in local storage
    localStorage.setItem("DOB", JSON.stringify({
      month: monthEl.value,
      year: yearEl.value,
      day: dayEl.value
    }));

    if (_dateIsValid()) {
      itemCount = calculateElapsedTime();
      _repaintItems(itemCount);
    } else {
      _repaintItems(0);
    }
    _updateTracker(_dateIsValid() ? itemCount : 0);
  }

  function _handleUpdown(e) {
    var newNum;
    // A crossbrowser keycode option.
    thisKey = e.keyCode || e.which;
    if (e.target.checkValidity()) {
      if (thisKey === KEY.UP) {
        newNum = parseInt(e.target.value, 10);
        e.target.value = newNum += 1;
        // we call the date change function manually because the input event isn't
        // triggered by arrow keys, or by manually setting the value, as we've done.
        _handleDateChange();
      } else if (thisKey === KEY.DOWN) {
        newNum = parseInt(e.target.value, 10);
        e.target.value = newNum -= 1;
        _handleDateChange();
      }
    }
  }

  function _unhideValidationStyles(e) {
    e.target.classList.add('touched');
  }

  function calculateElapsedTime() {
    var currentDate = new Date(),
      dateOfBirth = _getDateOfBirth(),
      diff = currentDate.getTime() - dateOfBirth.getTime(),
      elapsedTime;

    switch (unitText) {
      case 'weeks':
        // Measuring weeks is tricky since our chart shows 52 weeks per year (for simplicity)
        // when the actual number of weeks per year is 52.143. Attempting to calculate weeks
        // with a diffing strategy will result in build-up over time. Instead, we'll add up
        // 52 per elapsed full year, and only diff the weeks on the current partial year.
        var elapsedYears = (new Date(diff).getUTCFullYear() - 1970);
        var isThisYearsBirthdayPassed = (currentDate.getTime() > new Date(currentDate.getUTCFullYear(), monthEl.value, dayEl.value).getTime());
        var birthdayYearOffset = isThisYearsBirthdayPassed ? 0 : 1;
        var dateOfLastBirthday = new Date(currentDate.getUTCFullYear() - birthdayYearOffset, monthEl.value, dayEl.value);
        var elapsedDaysSinceLastBirthday = Math.floor((currentDate.getTime() - dateOfLastBirthday.getTime()) / (1000 * 60 * 60 * 24));
        var elapsedWeeks = (elapsedYears * 52) + Math.floor(elapsedDaysSinceLastBirthday / 7);
        elapsedTime = elapsedWeeks;
        break;
      case 'months':
        // Months are tricky, being variable length, so I opted for the average number
        // of days in a month as a close-enough approximation (30.4375). This can make
        // the chart look off by a day when you're right on the month threshold, but
        // it's otherwise fairly accurate over long periods of time.
        elapsedTime = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.4375));
        break;
      case 'years':
        // We can represent our millisecond diff as a year and subtract 1970 to
        // end up with an accurate elapsed time. To see why, consider the following:
        //
        //   1. JavaScript's Date timestamp represents milliseconds since 1970. Thus,
        //      new Date(0).toUTCString() → 'Thu, 01 Jan 1970 00:00:00 GMT'
        //   2. Picture the diff between today and tomorrow. It's a small number. A
        //      newly created date with that number would result in January 2 1970.
        //   3. Thus, subtracting 1970 from that date gives us elapsed time. We use
        //      UTC because otherwise we'd need to offset "1970" by our timezone.
        //
        // See more details here: https://stackoverflow.com/a/24181701/1154642
        elapsedTime = (new Date(diff).getUTCFullYear() - 1970);
        break;
    }

    return elapsedTime;
  }

  function _dateIsValid() {
    return monthEl.checkValidity() && dayEl.checkValidity() && yearEl.checkValidity();
  }

  function _getDateOfBirth() {
    return new Date(yearEl.value, monthEl.value, dayEl.value);
  }

  function _repaintItems(number) {
    for (var i = 0; i < items.length; i++) {
      if (i < number) {
        items[i].classList.add('is-lived');
      } else {
        items[i].classList.remove('is-lived');
      }
    }
  }

  function _loadStoredValueOfDOB() {
    var DOB = JSON.parse(localStorage.getItem('DOB'));

    if (!DOB) {
      _updateTracker(0);
      return;
    }

    if (DOB.month >= 0 && DOB.month < 12) {
      monthEl.value = DOB.month
    }

    if (DOB.year) {
      yearEl.value = DOB.year
    }

    if (DOB.day > 0 && DOB.day < 32) {
      dayEl.value = DOB.day
    }
    _handleDateChange();
  }

  function _updateTracker(elapsedUnits) {
    if (!trackerCountEl || !trackerUnitEl || !trackerPercentEl || !trackerTotalEl) {
      return;
    }
    var totalUnits = items.length;
    var percent = totalUnits ? (elapsedUnits / totalUnits) * 100 : 0;
    trackerCountEl.textContent = elapsedUnits;
    trackerUnitEl.textContent = unitText;
    trackerTotalEl.textContent = totalUnits;
    trackerPercentEl.textContent = percent.toFixed(1);
    if (trackerSubEl) {
      trackerSubEl.textContent = 'lived so far';
    }
  }

  function _loadQuote() {
    if (!quoteTextEl || !quoteAuthorEl) {
      return;
    }
        var quotes = [
      { text: 'Time is what we want most, but what we use worst.', author: 'William Penn' },
      { text: 'The two most powerful warriors are patience and time.', author: 'Leo Tolstoy' },
      { text: 'Time you enjoy wasting is not wasted time.', author: 'Bertrand Russell' },
      { text: 'Lost time is never found again.', author: 'Benjamin Franklin' },
      { text: 'Time is the most valuable thing a man can spend.', author: 'Theophrastus' },
      { text: 'Time is the wisest counselor of all.', author: 'Pericles' },
      { text: 'All we have to decide is what to do with the time that is given us.', author: 'J.R.R. Tolkien' },
      { text: 'Better three hours too soon than a minute too late.', author: 'William Shakespeare' },
      { text: 'A man who dares to waste one hour of time has not discovered the value of life.', author: 'Charles Darwin' },
      { text: 'Time is money.', author: 'Benjamin Franklin' },
      { text: 'The key is in not spending time, but in investing it.', author: 'Stephen R. Covey' },
      { text: 'The bad news is time flies. The good news is you are the pilot.', author: 'Michael Altshuler' },
      { text: 'You may delay, but time will not.', author: 'Benjamin Franklin' },
      { text: 'Time brings all things to pass.', author: 'Aeschylus' },
      { text: 'No man goes before his time. Unless the boss leaves early.', author: 'Groucho Marx' },
      { text: 'Time is the longest distance between two places.', author: 'Tennessee Williams' },
      { text: 'He who every morning plans the transactions of the day and follows out that plan carries a thread that will guide him.', author: 'Victor Hugo' },
      { text: 'To live is so startling it leaves little time for anything else.', author: 'Emily Dickinson' },
      { text: 'Time is a storm in which we are all lost.', author: 'William Carlos Williams' },
      { text: 'There is one kind of robber whom the law does not strike at, and who steals what is most precious to men: time.', author: 'Napoleon Bonaparte' },
      { text: 'Time is a created thing. To say I dont have time is to say I dont want to.', author: 'Lao Tzu' },
      { text: 'The future is something which everyone reaches at the rate of sixty minutes an hour.', author: 'C. S. Lewis' },
      { text: 'Nothing is a waste of time if you use the experience wisely.', author: 'Auguste Rodin' },
      { text: 'It is not that we have a short time to live, but that we waste a lot of it.', author: 'Seneca' },
      { text: 'Life, if well lived, is long enough.', author: 'Seneca' },
      { text: 'The trouble is, you think you have time.', author: 'Buddha' },
      { text: 'The present time has one advantage over every otherit is our own.', author: 'Charles Caleb Colton' },
      { text: 'Time is the school in which we learn, time is the fire in which we burn.', author: 'Delmore Schwartz' },
      { text: 'There is no such thing as time and timelessness.', author: 'M.C. Escher' },
      { text: 'You cannot step twice into the same river.', author: 'Heraclitus' },
      { text: 'Time is the substance of which I am made.', author: 'Jorge Luis Borges' },
      { text: 'We must use time as a tool, not as a couch.', author: 'John F. Kennedy' },
      { text: 'The butterfly counts not months but moments, and has time enough.', author: 'Rabindranath Tagore' },
      { text: 'Time is the most valuable thing we have, and the most wasted.', author: 'Anonymous' },
      { text: 'A stitch in time saves nine.', author: 'Proverb' },
      { text: 'Time is a great teacher, but unfortunately it kills all its pupils.', author: 'Hector Berlioz' },
      { text: 'They always say time changes things, but you actually have to change them yourself.', author: 'Andy Warhol' },
      { text: 'It is the time you have wasted for your rose that makes your rose so important.', author: 'Antoine de Saint-Exupery' },
      { text: 'If you spend too much time thinking about a thing, youll never get it done.', author: 'Bruce Lee' },
      { text: 'Time is but the stream I go a-fishing in.', author: 'Henry David Thoreau' },
      { text: 'The more you value your time, the more you value yourself.', author: 'Anonymous' },
      { text: 'Do not squander time, for that is the stuff life is made of.', author: 'Benjamin Franklin' },
      { text: 'A wise person does at once what a fool does at last.', author: 'Baltasar Gracian' },
      { text: 'There is a time for everything.', author: 'Ecclesiastes' },
      { text: 'Time stays long enough for anyone who will use it.', author: 'Leonardo da Vinci' },
      { text: 'Time is the most precious gift you can give and receive.', author: 'Anonymous' },
      { text: 'We are always getting ready to live, but never living.', author: 'Ralph Waldo Emerson' },
      { text: 'One day you will wake up and there wont be any more time to do the things youve always wanted.', author: 'Paulo Coelho' },
      { text: 'How did it get so late so soon"', author: 'Dr. Seuss' },
      { text: 'The time you enjoy wasting is not wasted time.', author: 'Marthe Troly-Curtin' },
      { text: 'Time waits for no one.', author: 'Proverb' },
      { text: 'Life is short, and it is up to you to make it sweet.', author: 'Sarah Louise Delany' },
      { text: 'The fear of death follows from the fear of life.', author: 'Mark Twain' },
      { text: 'The idea is to die young as late as possible.', author: 'Ashley Montagu' },
      { text: 'To die will be an awfully big adventure.', author: 'J.M. Barrie' },
      { text: 'He who fears death will never do anything worth of a man who is alive.', author: 'Seneca' },
      { text: 'It is not length of life, but depth of life.', author: 'Ralph Waldo Emerson' },
      { text: 'The longer I live, the more beautiful life becomes.', author: 'Frank Lloyd Wright' },
      { text: 'Life is really simple, but we insist on making it complicated.', author: 'Confucius' },
      { text: 'Life can only be understood backwards; but it must be lived forwards.', author: 'Sren Kierkegaard' },
      { text: 'It is not death that a man should fear, but he should fear never beginning to live.', author: 'Marcus Aurelius' },
      { text: 'Time is the currency of your life. Spend it wisely.', author: 'Anonymous' },
      { text: 'We are more often frightened than hurt; and we suffer more in imagination than in reality.', author: 'Seneca' },
      { text: 'Man is disturbed not by things, but by the view he takes of them.', author: 'Epictetus' },
      { text: 'There is nothing permanent except change.', author: 'Heraclitus' },
      { text: 'They say time heals all wounds, but that presumes the source of the grief is finite.', author: 'Cassandra Clare' },
      { text: 'Fear is the mind-killer.', author: 'Frank Herbert' },
      { text: 'It always seems impossible until its done.', author: 'Nelson Mandela' },
      { text: 'Time is a gift you give yourself.', author: 'Cheryl Strayed' },
      { text: 'The days are long, but the years are short.', author: 'Gretchen Rubin' },
      { text: 'The unexamined life is not worth living.', author: 'Socrates' },
      { text: 'Our time here is magic, it is passing.', author: 'Anonymous' },
      { text: 'We do not remember days, we remember moments.', author: 'Cesare Pavese' },
      { text: 'All the time in the world is not enough time to do everything.', author: 'Anonymous' },
      { text: 'Time has no meaning when you are with the right person.', author: 'Anonymous' },
      { text: 'The best time for new beginnings is now.', author: 'Anonymous' },
      { text: 'Time is what keeps everything from happening at once.', author: 'Ray Cummings' },
      { text: 'Time reveals all things.', author: 'Sophocles' },
      { text: 'Yesterday is gone. Tomorrow has not yet come. We have only today.', author: 'Mother Teresa' },
      { text: 'Death is not the greatest loss in life. The greatest loss is what dies inside while still alive.', author: 'Norman Cousins' },
      { text: 'Do not be anxious about the future. The present is enough.', author: 'Anonymous' },
      { text: 'Life is short. Live it.', author: 'Anonymous' },
      { text: 'Time and tide wait for no man.', author: 'Geoffrey Chaucer' },
      { text: 'The clock ticks. Make it count.', author: 'Anonymous' },
      { text: 'Our lives are measured in time, and time is measured in moments.', author: 'Anonymous' },
      { text: 'Time is a flat circle.', author: 'Rust Cohle' },
      { text: 'Make the most of yourself, for that is all there is of you.', author: 'Ralph Waldo Emerson' },
      { text: 'No one is promised tomorrow.', author: 'Anonymous' },
      { text: 'It is not the years in your life but the life in your years that count.', author: 'Abraham Lincoln' },
      { text: 'We are not given a good life or a bad life, but time.', author: 'Anonymous' },
      { text: 'When you arise in the morning think of what a privilege it is to be alive.', author: 'Marcus Aurelius' },
      { text: 'The future depends on what you do today.', author: 'Mahatma Gandhi' },
      { text: 'Time is the coin of your life. It is the only coin you have.', author: 'Carl Sandburg' },
      { text: 'The only reason for time is so that everything doesnt happen at once.', author: 'Albert Einstein' },
      { text: 'We are always making time for the things we care about.', author: 'Anonymous' },
      { text: 'The present moment is filled with joy and happiness. If you are attentive, you will see it.', author: 'Thich Nhat Hanh' },
      { text: 'Let us prepare our minds as if wed come to the very end of life.', author: 'Seneca' },
      { text: 'Remember that you are mortal.', author: 'Stoic maxim' },
      { text: 'The art of living is more like wrestling than dancing.', author: 'Marcus Aurelius' },
      { text: 'We must all die. But that I can save him from days of misery is what I feel as a duty.', author: 'Harriet Beecher Stowe' },
    ];
    var choice = quotes[Math.floor(Math.random() * quotes.length)];
    quoteTextEl.textContent = '\"' + choice.text + '\"';
    quoteAuthorEl.textContent = choice.author;
  }

  function _openNote() {
    if (!notePanelEl || !noteTextEl) {
      return;
    }
    notePanelEl.classList.remove('is-hidden');
    _autoResizeNote();
    noteTextEl.focus();
  }

  function _closeNote() {
    if (!notePanelEl) {
      return;
    }
    notePanelEl.classList.add('is-hidden');
  }

  function _handleNoteKeydown(e) {
    if (e.keyCode === 13 && !e.shiftKey) {
      e.preventDefault();
      _closeNote();
    }
  }

  function _autoResizeNote() {
    if (!noteTextEl) {
      return;
    }
    noteTextEl.style.height = 'auto';
    noteTextEl.style.height = noteTextEl.scrollHeight + 'px';
  }

  function _handleExportChange(e) {
    var format = e.target.value;
    if (!format) {
      return;
    }

    var payload = _buildExportPayload();
    var tableData = _buildTableRows(payload);
    var filename = _buildFilename(format);

    if (format === 'csv') {
      _downloadFile(_buildCsv(tableData), filename, 'text/csv;charset=utf-8');
    } else if (format === 'json') {
      _downloadFile(JSON.stringify(payload, null, 2), filename, 'application/json');
    } else if (format === 'xlsx') {
      _downloadFile(_buildSpreadsheetXml(tableData), filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    } else if (format === 'xlsm') {
      _downloadFile(_buildSpreadsheetXml(tableData), filename, 'application/vnd.ms-excel');
    }

    e.target.selectedIndex = 0;
  }

  function _buildExportPayload() {
    var now = new Date();
    var dob = _dateIsValid() ? _getDateOfBirth() : null;
    var elapsedUnits = _dateIsValid() ? calculateElapsedTime() : 0;
    var totalUnits = items.length;

    return {
      meta: {
        unit: unitText,
        generated_at: now.toISOString(),
        date_of_birth: dob ? _formatDate(dob) : '',
        elapsed_units: elapsedUnits,
        total_units: totalUnits
      },
      rows: _buildDataRows(elapsedUnits, totalUnits)
    };
  }

  function _buildDataRows(elapsedUnits, totalUnits) {
    var rows = [];
    for (var i = 0; i < totalUnits; i++) {
      var row = {
        index: i + 1,
        elapsed: i < elapsedUnits
      };

      if (unitText === 'weeks') {
        row.age_year = Math.floor(i / 52);
        row.week_of_year = (i % 52) + 1;
      } else if (unitText === 'months') {
        row.age_year = Math.floor(i / 12);
        row.month_of_year = (i % 12) + 1;
      } else if (unitText === 'years') {
        row.age_year = i;
      }

      rows.push(row);
    }
    return rows;
  }

  function _buildTableRows(payload) {
    var columns = [
      'unit',
      'generated_at',
      'date_of_birth',
      'elapsed_units',
      'total_units',
      'index',
      'elapsed'
    ];

    if (unitText === 'weeks') {
      columns.push('age_year', 'week_of_year');
    } else if (unitText === 'months') {
      columns.push('age_year', 'month_of_year');
    } else if (unitText === 'years') {
      columns.push('age_year');
    }

    var rows = [];
    for (var i = 0; i < payload.rows.length; i++) {
      var row = payload.rows[i];
      rows.push({
        unit: payload.meta.unit,
        generated_at: payload.meta.generated_at,
        date_of_birth: payload.meta.date_of_birth,
        elapsed_units: payload.meta.elapsed_units,
        total_units: payload.meta.total_units,
        index: row.index,
        elapsed: row.elapsed ? 'yes' : 'no',
        age_year: row.age_year,
        week_of_year: row.week_of_year,
        month_of_year: row.month_of_year
      });
    }

    return {
      columns: columns,
      rows: rows
    };
  }

  function _buildCsv(tableData) {
    var lines = [];
    lines.push(tableData.columns.join(','));
    for (var i = 0; i < tableData.rows.length; i++) {
      var row = tableData.rows[i];
      var line = tableData.columns.map(function (column) {
        return _escapeCsvValue(row[column]);
      }).join(',');
      lines.push(line);
    }
    return lines.join('\n');
  }

  function _buildSpreadsheetXml(tableData) {
    var xml = '';
    xml += '<?xml version="1.0"?>\n';
    xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
    xml += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
    xml += '  <Worksheet ss:Name="Your Life">\n';
    xml += '    <Table>\n';
    xml += '      <Row>' + tableData.columns.map(function (column) {
      return '<Cell><Data ss:Type="String">' + _escapeXml(column) + '</Data></Cell>';
    }).join('') + '</Row>\n';

    for (var i = 0; i < tableData.rows.length; i++) {
      var row = tableData.rows[i];
      var rowXml = tableData.columns.map(function (column) {
        var value = row[column];
        var type = (typeof value === 'number') ? 'Number' : 'String';
        if (value === null || value === undefined) {
          value = '';
          type = 'String';
        }
        return '<Cell><Data ss:Type="' + type + '">' + _escapeXml(String(value)) + '</Data></Cell>';
      }).join('');
      xml += '      <Row>' + rowXml + '</Row>\n';
    }

    xml += '    </Table>\n';
    xml += '  </Worksheet>\n';
    xml += '</Workbook>';
    return xml;
  }

  function _downloadFile(content, filename, mimeType) {
    var blob = new Blob([content], { type: mimeType });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(function () {
      URL.revokeObjectURL(link.href);
      link.remove();
    }, 0);
  }

  function _buildFilename(extension) {
    var stamp = _formatDateForFilename(new Date());
    return 'your-life-' + unitText + '-' + stamp + '.' + extension;
  }

  function _formatDate(date) {
    return date.getFullYear() + '-' + _pad2(date.getMonth() + 1) + '-' + _pad2(date.getDate());
  }

  function _formatDateForFilename(date) {
    return date.getFullYear() +
      _pad2(date.getMonth() + 1) +
      _pad2(date.getDate()) +
      '-' +
      _pad2(date.getHours()) +
      _pad2(date.getMinutes()) +
      _pad2(date.getSeconds());
  }

  function _pad2(value) {
    return value < 10 ? '0' + value : String(value);
  }

  function _escapeCsvValue(value) {
    if (value === null || value === undefined) {
      return '';
    }
    var stringValue = String(value);
    if (/[",\n]/.test(stringValue)) {
      return '"' + stringValue.replace(/"/g, '""') + '"';
    }
    return stringValue;
  }

  function _escapeXml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
})();
