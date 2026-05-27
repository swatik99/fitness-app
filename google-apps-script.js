/**
 * Google Apps Script — Swati Fitness Sync
 * 
 * SETUP:
 * 1. Go to Google Sheets → create new sheet → name it "Fitness Data"
 * 2. Extensions → Apps Script
 * 3. Paste this entire file
 * 4. Click Deploy → New Deployment
 * 5. Type: Web App
 * 6. Execute as: Me
 * 7. Who has access: Anyone
 * 8. Deploy → copy the URL
 * 9. Paste URL in app Config tab
 */

function doPost(e) {
  try {
    var raw = e.postData ? e.postData.contents : null;
    if (!raw) return ContentService.createTextOutput(JSON.stringify({status: 'error', message: 'No data'})).setMimeType(ContentService.MimeType.JSON);
    var data = JSON.parse(raw);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Entries sheet
    var entrySheet = getOrCreateSheet(ss, 'Entries');
    if (entrySheet.getLastRow() === 0) {
      entrySheet.appendRow(['Date', 'Weight', 'Waist', 'Arm', 'Soreness', 'Energy', 'Steps', 'Stairs', 'Sleep', 'Notes']);
    }
    
    if (data.entries && data.entries.length > 0) {
      // Clear and rewrite all entries (simple sync)
      if (entrySheet.getLastRow() > 1) {
        entrySheet.getRange(2, 1, entrySheet.getLastRow() - 1, 10).clear();
      }
      for (var i = 0; i < data.entries.length; i++) {
        var en = data.entries[i];
        entrySheet.appendRow([en.date, en.weight, en.waist, en.arm, en.soreness, en.energy, en.steps, en.stairs, en.sleep, en.notes]);
      }
    }
    
    // Workout log sheet
    var woSheet = getOrCreateSheet(ss, 'Workouts');
    if (woSheet.getLastRow() === 0) {
      woSheet.appendRow(['Date', 'Workout', 'Rounds']);
    }
    if (data.workout_log && data.workout_log.length > 0) {
      if (woSheet.getLastRow() > 1) {
        woSheet.getRange(2, 1, woSheet.getLastRow() - 1, 3).clear();
      }
      for (var j = 0; j < data.workout_log.length; j++) {
        var w = data.workout_log[j];
        woSheet.appendRow([w.date, w.workout, w.rounds]);
      }
    }
    
    // Level log sheet
    var lvlSheet = getOrCreateSheet(ss, 'Levels');
    if (lvlSheet.getLastRow() === 0) {
      lvlSheet.appendRow(['Date', 'Exercise', 'Choice', 'Timestamp']);
    }
    if (data.level_log && data.level_log.length > 0) {
      if (lvlSheet.getLastRow() > 1) {
        lvlSheet.getRange(2, 1, lvlSheet.getLastRow() - 1, 4).clear();
      }
      for (var k = 0; k < data.level_log.length; k++) {
        var l = data.level_log[k];
        lvlSheet.appendRow([l.date, l.exercise, l.choice, l.ts]);
      }
    }
    
    // Cook log sheet
    var cookSheet = getOrCreateSheet(ss, 'Cooking');
    if (cookSheet.getLastRow() === 0) {
      cookSheet.appendRow(['Date', 'Recipe', 'Timestamp']);
    }
    if (data.cook_log && data.cook_log.length > 0) {
      if (cookSheet.getLastRow() > 1) {
        cookSheet.getRange(2, 1, cookSheet.getLastRow() - 1, 3).clear();
      }
      for (var m = 0; m < data.cook_log.length; m++) {
        var c = data.cook_log[m];
        cookSheet.appendRow([c.date, c.recipe, c.ts]);
      }
    }
    
    syncFeedback(ss, data);
    
    return ContentService.createTextOutput(JSON.stringify({status: 'ok'})).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: err.message})).setMimeType(ContentService.MimeType.JSON);
  }
}

function syncFeedback(ss, data) {
  if (!data.feedback || data.feedback.length === 0) return;
  var sheet = getOrCreateSheet(ss, 'Feedback');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Date', 'Time', 'Feedback']);
  }
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).clear();
  }
  for (var i = 0; i < data.feedback.length; i++) {
    var fb = data.feedback[i];
    sheet.appendRow([fb.date, fb.time, fb.text]);
  }
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var result = {};
  var sheets = ['Entries', 'Workouts', 'Levels', 'Cooking', 'Feedback', 'Calories'];
  for (var i = 0; i < sheets.length; i++) {
    var sheet = ss.getSheetByName(sheets[i]);
    if (sheet && sheet.getLastRow() > 0) {
      result[sheets[i]] = sheet.getDataRange().getValues();
    }
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}
