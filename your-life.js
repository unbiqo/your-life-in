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
    trackerPercentEl = document.getElementById('life-percent'),
    trackerSelectedEl = document.getElementById('life-selected'),
    quoteTextEl = document.getElementById('quote-text'),
    quoteAuthorEl = document.getElementById('quote-author'),
    selectedItem = null,
    itemCount,
    COLOR = '#d04a2f',
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
  if (chartEl) {
    chartEl.addEventListener('click', _handleChartClick);
    chartEl.addEventListener('keydown', _handleChartKeydown);
  }

  // Ensure the month is unselected by default.
  monthEl.selectedIndex = -1;
  _setItemMetadata();

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
        items[i].style.backgroundColor = COLOR;
      } else {
        items[i].style.backgroundColor = '';
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

  function _setItemMetadata() {
    for (var i = 0; i < items.length; i++) {
      var index = i + 1;
      items[i].setAttribute('data-index', index);
      items[i].setAttribute('tabindex', '0');
      items[i].setAttribute('role', 'button');
      items[i].setAttribute('aria-label', _buildItemLabel(index));
    }
  }

  function _buildItemLabel(index) {
    var singular = 'Unit';
    if (unitText === 'weeks') {
      singular = 'Week';
    } else if (unitText === 'months') {
      singular = 'Month';
    } else if (unitText === 'years') {
      singular = 'Year';
    }
    return singular + ' ' + index;
  }

  function _handleChartClick(e) {
    if (e.target && e.target.tagName === 'LI') {
      _selectItem(e.target);
    }
  }

  function _handleChartKeydown(e) {
    if (!e.target || e.target.tagName !== 'LI') {
      return;
    }
    var key = e.keyCode || e.which;
    if (key === 13 || key === 32) {
      e.preventDefault();
      _selectItem(e.target);
    }
  }

  function _selectItem(item) {
    if (selectedItem) {
      selectedItem.classList.remove('is-selected');
    }
    selectedItem = item;
    selectedItem.classList.add('is-selected');
    var index = parseInt(item.getAttribute('data-index'), 10);
    _updateSelectedIndicator(index);
  }

  function _updateSelectedIndicator(index) {
    if (!trackerSelectedEl) {
      return;
    }
    trackerSelectedEl.textContent = 'Selected: ' + index + ' of ' + items.length;
  }

  function _updateTracker(elapsedUnits) {
    if (!trackerCountEl || !trackerUnitEl || !trackerPercentEl) {
      return;
    }
    var totalUnits = items.length;
    var percent = totalUnits ? (elapsedUnits / totalUnits) * 100 : 0;
    trackerCountEl.textContent = elapsedUnits;
    trackerUnitEl.textContent = unitText;
    trackerPercentEl.textContent = percent.toFixed(1);
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
      { text: 'There is one kind of robber whom the law does not strike at, and who steals what is most precious to men: time.', author: 'Napoleon Bonaparte' }
    ];
    var choice = quotes[Math.floor(Math.random() * quotes.length)];
    quoteTextEl.textContent = '\"' + choice.text + '\"';
    quoteAuthorEl.textContent = choice.author;
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
