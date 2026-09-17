/* ==========================================================================
   Doodle Desk — rooms and live sync (DoodleNet)

   Rooms, students and boards live in localStorage; live updates travel over a
   BroadcastChannel (with a localStorage "storage" event fallback for older
   browsers). That means the whole app genuinely works across browser tabs on
   one machine, with no server.

   Everything a page needs goes through this module, so swapping the transport
   for a real WebSocket server later means rewriting send/on and the store
   functions here — not the pages. See README.md.
   ========================================================================== */
window.DoodleNet = (function () {
  "use strict";

  var STORE_KEY = "doodle-rooms";
  var TEACHER_KEY = "doodle-teacher";
  var BUS_KEY = "doodle-bus";
  var PROTOCOL = 1;

  /* One id per tab, so a tab never reacts to its own broadcasts */
  var clientId = Math.random().toString(36).slice(2, 10);

  /* ---- Storage ---------------------------------------------------------- */
  function readStore() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY)) || { rooms: {} };
    } catch (e) {
      return { rooms: {} };
    }
  }

  function writeStore(state) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      /* Almost always the quota, and thumbnails are the bulky part — drop
         them and keep the rooms themselves rather than losing everything. */
      try {
        Object.keys(state.rooms).forEach(function (code) {
          var students = state.rooms[code].students || {};
          Object.keys(students).forEach(function (id) { delete students[id].thumb; });
        });
        localStorage.setItem(STORE_KEY, JSON.stringify(state));
        return true;
      } catch (err) {
        return false;
      }
    }
  }

  /* ---- Room codes ------------------------------------------------------- */
  /* Short, sayable, and easy to copy off a board from the back of the room */
  var WORDS = ["SUN", "CAT", "DOG", "SKY", "FOX", "OWL", "BEE", "ELK", "JAM",
               "PIE", "MAP", "KEY", "BUS", "OAK", "ICE", "FIG", "YAK", "POD"];
  var LETTERS = "ABCDEFGHJKLMNPRSTUVWXYZ"; /* no I/O/Q — they read as 1/0 */

  function makeCode(existing) {
    for (var tries = 0; tries < 200; tries++) {
      var code = WORDS[Math.floor(Math.random() * WORDS.length)] + "-" +
        Math.floor(10 + Math.random() * 90) +
        LETTERS[Math.floor(Math.random() * LETTERS.length)];
      if (!existing[code]) return code;
    }
    return "ROOM-" + Date.now().toString(36).toUpperCase();
  }

  /* ---- Rooms ------------------------------------------------------------ */
  function createRoom(details) {
    var state = readStore();
    var room = {
      code: makeCode(state.rooms),
      name: (details.name || "Untitled room").slice(0, 60),
      subject: details.subject || "✏️ General",
      prompt: (details.prompt || "").slice(0, 160),
      teacher: (details.teacher || "Teacher").slice(0, 40),
      frozen: false,
      createdAt: Date.now(),
      students: {}
    };
    state.rooms[room.code] = room;
    writeStore(state);
    return room;
  }

  function getRoom(code) {
    if (!code) return null;
    return readStore().rooms[String(code).toUpperCase()] || null;
  }

  function listRooms() {
    var rooms = readStore().rooms;
    return Object.keys(rooms).map(function (c) { return rooms[c]; })
      .sort(function (a, b) { return b.createdAt - a.createdAt; });
  }

  function updateRoom(code, patch) {
    var state = readStore();
    var room = state.rooms[code];
    if (!room) return null;
    Object.keys(patch).forEach(function (k) { room[k] = patch[k]; });
    writeStore(state);
    return room;
  }

  function deleteRoom(code) {
    var state = readStore();
    delete state.rooms[code];
    writeStore(state);
    send("room-closed", { code: code });
  }

  /* ---- Students --------------------------------------------------------- */
  function joinRoom(code, name) {
    code = String(code || "").toUpperCase().trim();
    var state = readStore();
    var room = state.rooms[code];
    if (!room) return { ok: false, error: "We can't find a room with that code." };

    var student = {
      id: "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: (name || "Student").slice(0, 24),
      status: "working",
      joinedAt: Date.now(),
      lastSeen: Date.now(),
      marks: 0,
      thumb: ""
    };
    room.students[student.id] = student;
    writeStore(state);
    send("join", { code: code, student: student });
    return { ok: true, student: student, room: room };
  }

  function setStudent(code, id, patch) {
    var state = readStore();
    var room = state.rooms[code];
    if (!room || !room.students[id]) return null;
    Object.keys(patch).forEach(function (k) { room.students[id][k] = patch[k]; });
    room.students[id].lastSeen = Date.now();
    writeStore(state);
    return room.students[id];
  }

  function removeStudent(code, id) {
    var state = readStore();
    var room = state.rooms[code];
    if (!room) return;
    delete room.students[id];
    writeStore(state);
    send("leave", { code: code, studentId: id });
  }

  function getStudents(code) {
    var room = getRoom(code);
    if (!room) return [];
    return Object.keys(room.students).map(function (id) { return room.students[id]; })
      .sort(function (a, b) { return a.joinedAt - b.joinedAt; });
  }

  /* ---- Identity --------------------------------------------------------- */
  function teacher() {
    try {
      return JSON.parse(localStorage.getItem(TEACHER_KEY)) || null;
    } catch (e) {
      return null;
    }
  }

  function setTeacher(name) {
    var who = { name: (name || "Teacher").slice(0, 40), since: Date.now() };
    try { localStorage.setItem(TEACHER_KEY, JSON.stringify(who)); } catch (e) {}
    return who;
  }

  /* Per-tab, so opening three tabs gives you three students to test with */
  function me(code) {
    try {
      return JSON.parse(sessionStorage.getItem("doodle-me-" + code)) || null;
    } catch (e) {
      return null;
    }
  }

  function setMe(code, student) {
    try { sessionStorage.setItem("doodle-me-" + code, JSON.stringify(student)); } catch (e) {}
  }

  function forgetMe(code) {
    try { sessionStorage.removeItem("doodle-me-" + code); } catch (e) {}
  }

  /* A student's own full board, kept per tab so a refresh restores it */
  function saveMyBoard(code, id, items) {
    try {
      sessionStorage.setItem("doodle-board-" + code + "-" + id, JSON.stringify(items));
    } catch (e) {}
  }

  function loadMyBoard(code, id) {
    try {
      return JSON.parse(sessionStorage.getItem("doodle-board-" + code + "-" + id)) || [];
    } catch (e) {
      return [];
    }
  }

  /* ---- Message bus ------------------------------------------------------ */
  var handlers = {};
  var channel = null;

  if ("BroadcastChannel" in window) {
    channel = new BroadcastChannel("doodle-desk");
    channel.addEventListener("message", function (e) { deliver(e.data); });
  } else {
    /* Fallback: a localStorage key others see change. The writing tab does
       not get its own storage event, which is exactly what we want. */
    window.addEventListener("storage", function (e) {
      if (e.key !== BUS_KEY || !e.newValue) return;
      try { deliver(JSON.parse(e.newValue)); } catch (err) {}
    });
  }

  function deliver(msg) {
    if (!msg || msg.v !== PROTOCOL || msg.from === clientId) return;
    (handlers[msg.type] || []).forEach(function (fn) {
      try { fn(msg.payload || {}, msg); } catch (e) { /* one bad handler shouldn't stop the rest */ }
    });
    (handlers["*"] || []).forEach(function (fn) {
      try { fn(msg.payload || {}, msg); } catch (e) {}
    });
  }

  function send(type, payload) {
    var msg = { v: PROTOCOL, type: type, from: clientId, at: Date.now(), payload: payload || {} };
    if (channel) {
      channel.postMessage(msg);
    } else {
      try {
        localStorage.setItem(BUS_KEY, JSON.stringify(msg));
      } catch (e) {}
    }
    return msg;
  }

  function on(type, fn) {
    (handlers[type] = handlers[type] || []).push(fn);
    return function off() {
      handlers[type] = handlers[type].filter(function (f) { return f !== fn; });
    };
  }

  /* ---- Helpers ---------------------------------------------------------- */
  function joinUrl(code) {
    var base = location.href.replace(/[^/]*$/, "");
    return base + "board.html?code=" + encodeURIComponent(code);
  }

  function isOnline(student) {
    return Date.now() - (student.lastSeen || 0) < 20000;
  }

  return {
    clientId: clientId,
    createRoom: createRoom,
    getRoom: getRoom,
    listRooms: listRooms,
    updateRoom: updateRoom,
    deleteRoom: deleteRoom,
    joinRoom: joinRoom,
    setStudent: setStudent,
    removeStudent: removeStudent,
    getStudents: getStudents,
    teacher: teacher,
    setTeacher: setTeacher,
    me: me,
    setMe: setMe,
    forgetMe: forgetMe,
    saveMyBoard: saveMyBoard,
    loadMyBoard: loadMyBoard,
    send: send,
    on: on,
    joinUrl: joinUrl,
    isOnline: isOnline
  };
})();
