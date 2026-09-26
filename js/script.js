/* ==========================================================================
   رحلة اكتشاف الحروف — المنطق البرمجي
   يعمل بالكامل محليًا بدون إنترنت، بدون أي إطار عمل خارجي.
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------
     1) بيانات الدرس — مستخرجة من صور التدريبات المرفقة
     ------------------------------------------------------------------ */

  // نشاط استكشافي: حرف السين (س) وحرف الشين (ش)
  const EXPLORE_S_SH = [
    { id: "e1", emoji: "🐟", label: "سَمَكَة", target: "s" },
    { id: "e2", emoji: "🚗", label: "سَيَّارَة", target: "s" },
    { id: "e3", emoji: "☀️", label: "شَمْس", target: "sh" },
    { id: "e4", emoji: "🌳", label: "شَجَرَة", target: "sh" }
  ];

  // التدريب الأول (من صورة الكتاب): نصنّف الكلمات حسب حرف (س) أو (ش)
  const DRILL_CLASSIFY = [
    { id: "w1", label: "فَأْس", target: "s" },
    { id: "w2", label: "يَنْكُشُ", target: "sh" },
    { id: "w3", label: "شَيْئًا", target: "sh" },
    { id: "w4", label: "ابْتَسَمَ", target: "s" },
    { id: "w5", label: "سَنَةٌ", target: "s" },
    { id: "w6", label: "مِشْمِش", target: "sh" }
  ];

  // نشاط استكشافي: شكل حرف الصاد (ص) عندما يتصل بحرف بعده، وعندما يكون منفردًا
  const SHAPE_DEMO_EXAMPLES = [
    {
      wordHtml: "<span class=\"hl-letter c-connected\">ص</span>َقْر",
      glyph: "صـ",
      glyphClass: "c-connected",
      caption: "الحرف بأول الكلمة، ويأتي بعده حرف آخر"
    },
    {
      wordHtml: "قَفَ<span class=\"hl-letter c-final\">ص</span>",
      glyph: "ص",
      glyphClass: "c-final",
      caption: "الحرف آخر شيء في الكلمة، ولا يأتي بعده حرف"
    }
  ];

  // التدريب الثاني (من صورة الكتاب): نكتب حرف الصاد بالشكل المناسب في الكلمات
  // (متصلًا "صـ" إن جاء بعده حرف، أو منفصلًا "ص" إن كان آخر الكلمة)
  const DRILL_FILLBLANK = [
    { id: "b1", before: "", after: "يْف", full: "صَيْف" },
    { id: "b2", before: "يَرْقُ", after: "", full: "يَرْقُصُ" },
    { id: "b3", before: "أَقْفا", after: "", full: "أَقْفاص" },
    { id: "b4", before: "يَ", after: "لُ", full: "يَصِلُ" }
  ];

  // نشاط استكشافي: حرف الصاد (ص) وحرف الضاد (ض) — يسبق تدريب الاختيار
  const EXPLORE_S_D = [
    { id: "e1", emoji: "🦅", label: "صَقْر", target: "ss" },
    { id: "e2", emoji: "📦", label: "صُنْدُوق", target: "ss" },
    { id: "e3", emoji: "🐸", label: "ضِفْدَع", target: "dd" },
    { id: "e4", emoji: "🦷", label: "ضِرْس", target: "dd" }
  ];

  // التدريب الثالث (من صورة الكتاب): نختار الكلمة التي تحتوي على حرف (ض)
  const DRILL_SELECT = [
    { id: "s1", label: "أَرْض", correct: true },
    { id: "s2", label: "ضِفْدَعٌ", correct: true },
    { id: "s3", label: "الصَّغير", correct: false },
    { id: "s4", label: "طَلَب", correct: false },
    { id: "s5", label: "ضَباب", correct: true }
  ];

  // التدريب الرابع (من صورة الكتاب): نحلّل الكلمات إلى حروفها
  const DRILL_ANALYZE = [
    { id: "a1", label: "شَمْس" },
    { id: "a2", label: "يَحْصُد" },
    { id: "a3", label: "الْأَرْض" }
  ];

  /* ------------------------------------------------------------------
     2) أدوات مساعدة عامة
     ------------------------------------------------------------------ */

  const HARAKAT_RE = /[\u064B-\u0652\u0670\u0640]/g; // تشكيل + تطويل

  function stripHarakat(word) {
    return word.replace(HARAKAT_RE, "");
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function el(tag, className, html) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  /**
   * ينطق كلمة عربية بصوت عالٍ باستخدام ميزة النطق المدمجة في المتصفح
   * (Web Speech API)، وتعمل هذه الميزة محليًا دون الحاجة إلى إنترنت
   * على معظم المتصفحات الحديثة. إن لم تكن متاحة، لا يحدث شيء.
   */
  function speak(text) {
    try {
      if (!text || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "ar-SA";
      utter.rate = 0.85;
      window.speechSynthesis.speak(utter);
    } catch (e) {
      /* النطق الصوتي غير متاح في هذا المتصفح، لا حاجة لإيقاف الدرس بسبب ذلك */
    }
  }

  /* ------------------------------------------------------------------
     3) الحالة العامة للدرس
     ------------------------------------------------------------------ */

  const state = {
    stepIndex: 0,
    stars: 0,
    results: {
      classify: { correct: 0, total: 0, label: "التمييز بين حرف (س) وحرف (ش)" },
      fillblank: { correct: 0, total: 0, label: "كتابة حرف الصاد بشكله المتصل (صـ) أو المنفصل (ص)" },
      select: { correct: 0, total: 0, label: "التعرّف على حرف (ض) داخل الكلمات" },
      analyze: { correct: 0, total: 0, label: "تحليل الكلمة إلى حروفها" }
    }
  };

  function addStar(n) {
    state.stars += n || 1;
    starsBadge.textContent = "⭐ " + state.stars;
    saveProgress();
  }

  function recordResult(skillKey, correct, total) {
    const r = state.results[skillKey];
    r.correct += correct;
    r.total += total;
    saveProgress();
  }

  function saveProgress() {
    try {
      localStorage.setItem(
        "letters_lesson_progress_v1",
        JSON.stringify({ stepIndex: state.stepIndex, stars: state.stars, results: state.results })
      );
    } catch (e) {
      /* localStorage قد يكون غير متاح، لا مشكلة في ذلك */
    }
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem("letters_lesson_progress_v1");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function clearProgress() {
    try {
      localStorage.removeItem("letters_lesson_progress_v1");
    } catch (e) {}
  }

  /* ------------------------------------------------------------------
     4) عناصر الصفحة الثابتة
     ------------------------------------------------------------------ */

  const screens = {
    welcome: document.querySelector('[data-screen="welcome"]'),
    overview: document.querySelector('[data-screen="overview"]'),
    activity: document.getElementById("activityScreen"),
    finish: document.querySelector('[data-screen="finish"]')
  };
  const topbar = document.getElementById("topbar");
  const progressFill = document.getElementById("progressFill");
  const starsBadge = document.getElementById("starsBadge");

  function showScreen(key) {
    Object.values(screens).forEach((s) => {
      s.hidden = true;
      s.removeAttribute("data-active");
    });
    screens[key].hidden = false;
    // إعادة تشغيل حركة الدخول
    requestAnimationFrame(() => screens[key].setAttribute("data-active", "true"));
    topbar.hidden = key === "welcome";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ------------------------------------------------------------------
     5) تفاعل السحب / اللمس العام (للتصنيف في عمودين)
     ------------------------------------------------------------------ */

  function wireZoneTapPlacement(dropZones) {
    dropZones.forEach((zone) => {
      zone.el.addEventListener("click", () => {
        const sel = document.querySelector(".word-chip.tap-selected");
        if (sel && sel._placeCallback) {
          sel.classList.remove("tap-selected");
          sel._placeCallback(zone.id);
        }
      });
    });
  }

  function enableDragAndTap(chipEl, dropZones, onPlace, speakText) {
    chipEl._placeCallback = onPlace;
    chipEl.style.touchAction = "none";

    chipEl.addEventListener("pointerdown", (e) => {
      if (chipEl.classList.contains("placed")) return;
      e.preventDefault();
      if (speakText) speak(speakText);
      chipEl.setPointerCapture(e.pointerId);
      const startX = e.clientX,
        startY = e.clientY;
      let moved = false;
      const rect = chipEl.getBoundingClientRect();
      const offsetX = e.clientX - rect.left,
        offsetY = e.clientY - rect.top;

      function onMove(ev) {
        const dx = ev.clientX - startX,
          dy = ev.clientY - startY;
        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) moved = true;
        if (moved) {
          if (chipEl.style.position !== "fixed") {
            const r = chipEl.getBoundingClientRect();
            chipEl.style.width = r.width + "px";
            chipEl.style.position = "fixed";
            chipEl.style.zIndex = 999;
            chipEl.classList.add("dragging");
          }
          chipEl.style.left = ev.clientX - offsetX + "px";
          chipEl.style.top = ev.clientY - offsetY + "px";
          dropZones.forEach((z) => z.el.classList.remove("dragover"));
          const t = document.elementFromPoint(ev.clientX, ev.clientY);
          const zone = dropZones.find((z) => z.el.contains(t));
          if (zone) zone.el.classList.add("dragover");
        }
      }
      function onUp(ev) {
        try { chipEl.releasePointerCapture(e.pointerId); } catch (err) {}
        chipEl.removeEventListener("pointermove", onMove);
        chipEl.removeEventListener("pointerup", onUp);
        dropZones.forEach((z) => z.el.classList.remove("dragover"));
        if (moved) {
          chipEl.classList.remove("dragging");
          chipEl.style.position = "";
          chipEl.style.zIndex = "";
          chipEl.style.left = "";
          chipEl.style.top = "";
          chipEl.style.width = "";
          const t = document.elementFromPoint(ev.clientX, ev.clientY);
          const zone = dropZones.find((z) => z.el.contains(t));
          if (zone) onPlace(zone.id);
        } else {
          document.querySelectorAll(".word-chip.tap-selected").forEach((c) => {
            if (c !== chipEl) c.classList.remove("tap-selected");
          });
          chipEl.classList.toggle("tap-selected");
        }
      }
      chipEl.addEventListener("pointermove", onMove);
      chipEl.addEventListener("pointerup", onUp);
    });
  }

  /**
   * يبني نشاط "تصنيف ضمن عمودين" ويُستخدم لكل من الأنشطة الاستكشافية
   * (مطابقة صور بالحروف) وتدريب الكتاب الأول (تصنيف الكلمات).
   */
  function renderClassify(container, opts) {
    container.innerHTML = "";
    const wrap = el("div", "activity-wrap");
    wrap.innerHTML = `
      <div class="activity-kicker">${opts.kicker}</div>
      <h2 class="activity-title">${opts.title}</h2>
      <p class="activity-desc">${opts.desc}</p>
      <div class="activity-card">
        <div class="classify-bank" id="bank"></div>
        <div class="classify-columns" id="cols"></div>
        <div class="feedback-banner" id="fb"></div>
        <div class="activity-actions">
          <button class="btn btn-ghost" id="btnHint" type="button">تلميح 💡</button>
          <div class="activity-actions-right">
            <button class="btn btn-primary" id="btnNext" type="button" disabled>التالي ←</button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(wrap);

    const bank = wrap.querySelector("#bank");
    const colsWrap = wrap.querySelector("#cols");
    const fb = wrap.querySelector("#fb");
    const btnNext = wrap.querySelector("#btnNext");
    const btnHint = wrap.querySelector("#btnHint");

    opts.columns.forEach((col) => {
      const colEl = el(
        "div",
        "classify-col",
        `<div class="classify-col-head">${col.title}</div><div class="classify-col-body"></div>`
      );
      colEl.dataset.colId = col.id;
      colsWrap.appendChild(colEl);
    });

    const dropZones = Array.from(colsWrap.querySelectorAll(".classify-col")).map((zEl) => ({
      id: zEl.dataset.colId,
      el: zEl
    }));
    wireZoneTapPlacement(dropZones);

    let remaining = opts.chips.length;
    let correctCount = 0;

    function placeChip(chip, chipEl, colId) {
      const zone = dropZones.find((z) => z.id === colId);
      if (!zone) return;
      const isCorrect = colId === chip.target;
      if (isCorrect) {
        zone.el.querySelector(".classify-col-body").appendChild(chipEl);
        chipEl.classList.add("placed", "chip-result-ok");
        chipEl.style.cursor = "default";
        correctCount++;
        remaining--;
        addStar();
        if (remaining === 0) {
          fb.textContent = "رائع! صنّفت كل الكلمات بشكل صحيح 🎉";
          fb.className = "feedback-banner show ok";
          btnNext.disabled = false;
          if (opts.skillKey) recordResult(opts.skillKey, correctCount, opts.chips.length);
        }
      } else {
        chipEl.classList.add("chip-result-bad");
        fb.textContent = "حاول مرة أخرى، استمع لصوت الحرف في الكلمة 🎧";
        fb.className = "feedback-banner show bad";
        setTimeout(() => {
          chipEl.classList.remove("chip-result-bad");
          bank.appendChild(chipEl);
        }, 650);
      }
    }

    shuffle(opts.chips).forEach((chip) => {
      const chipEl = el(
        "div",
        "word-chip",
        opts.showEmoji
          ? `<div style="font-size:26px;">${chip.emoji}</div><div>${chip.label}</div>`
          : chip.label
      );
      bank.appendChild(chipEl);
      enableDragAndTap(chipEl, dropZones, (colId) => placeChip(chip, chipEl, colId), chip.label);
    });

    btnHint.addEventListener("click", () => {
      fb.textContent = opts.hint;
      fb.className = "feedback-banner show hint";
    });

    btnNext.addEventListener("click", opts.onComplete);
  }

  /* ------------------------------------------------------------------
     6) شاشات الاستكشاف (توضيح + سؤال وجواب + إبراز الحرف)
     ------------------------------------------------------------------ */

  function renderExploreIntro(container, opts) {
    // opts: kicker, title, qaLines(array), letters:[{text,colorClass,sound}], cards, columns, onComplete, hint
    container.innerHTML = "";
    const wrap = el("div", "activity-wrap");
    wrap.appendChild(el("div", "activity-kicker", opts.kicker));
    wrap.appendChild(el("h2", "activity-title", opts.title));
    wrap.appendChild(el("p", "activity-desc", opts.desc));

    const card = el("div", "activity-card");
    wrap.appendChild(card);
    container.appendChild(wrap);

    // خطوة ١: عرض البطاقات (صور/كلمات)
    const grid = el("div", "explore-grid");
    opts.cards.forEach((c) => {
      const cardEl = el(
        "div",
        "explore-card",
        `<div class="explore-emoji">${c.emoji}</div><div class="explore-word">${c.label} <span class="speaker-icon">🔊</span></div>`
      );
      cardEl.addEventListener("click", () => speak(c.label));
      grid.appendChild(cardEl);
    });
    card.appendChild(grid);

    // خطوة ٢: حوار واستنتاج
    const qa = el("div", "explore-qa");
    qa.innerHTML = opts.qaLines
      .map((line) => `<p><span class="q-label">${line.q}</span> ${line.a}</p>`)
      .join("");
    card.appendChild(qa);

    // خطوة ٣: إبراز الحروف بصريًا
    const reveal = el("div", "letter-reveal");
    opts.letters.forEach((L) => {
      reveal.appendChild(
        el("div", "letter-box " + L.colorClass, `<span>${L.text}</span><small>${L.sound}</small>`)
      );
    });
    card.appendChild(reveal);

    // خطوة ٤: زر الانتقال إلى لعبة المطابقة بالسحب
    const btnRow = el("div", "activity-actions");
    btnRow.innerHTML = `<span></span><div class="activity-actions-right"><button class="btn btn-primary" id="btnToMatch">والآن هيا نطابق! →</button></div>`;
    card.appendChild(btnRow);

    card.querySelector("#btnToMatch").addEventListener("click", () => {
      // استبدال محتوى البطاقة بنشاط المطابقة (سحب الكلمة إلى الحرف المناسب)
      renderClassify(container, {
        kicker: opts.kicker,
        title: "طابق كل كلمة مع حرفها",
        desc: "اسحب كل بطاقة إلى الحرف الذي يبدأ أو يحتوي عليه، أو اضغط على البطاقة ثم اضغط على الحرف المناسب.",
        chips: opts.cards,
        columns: opts.columns,
        showEmoji: true,
        hint: opts.hint,
        skillKey: null,
        onComplete: opts.onComplete
      });
    });
  }

  /* ------------------------------------------------------------------
     7) تدريب كتابة حرف الصاد بالشكل المناسب: متصل (صـ) أم منفصل (ص)
     ------------------------------------------------------------------ */

  function renderFillBlank(container, opts) {
    container.innerHTML = "";
    const wrap = el("div", "activity-wrap");
    wrap.innerHTML = `
      <div class="activity-kicker">${opts.kicker}</div>
      <h2 class="activity-title">${opts.title}</h2>
      <p class="activity-desc">${opts.desc}</p>
      <div class="activity-card" id="card"></div>
    `;
    container.appendChild(wrap);
    const card = wrap.querySelector("#card");

    let index = 0;
    let correctCount = 0;
    const gradedTotal = opts.items.length;

    function renderItem() {
      const item = opts.items[index];
      // إن جاء بعد الحرف حرفٌ آخر ضمن الكلمة، فشكله متصل (صـ)،
      // أمّا إن كان آخر شيء في الكلمة فشكله منفصل (ص).
      const required = item.after ? "connected" : "final";
      card.innerHTML = "";

      const rowWrap = el("div", "blank-word-row");
      const slot = el("span", "blank-slot", "؟");
      const wordSpan = el("span", "blank-word");
      wordSpan.appendChild(document.createTextNode(item.before));
      wordSpan.appendChild(slot);
      wordSpan.appendChild(document.createTextNode(item.after));
      rowWrap.appendChild(wordSpan);
      card.appendChild(rowWrap);

      const choices = el("div", "letter-choice-row");
      [
        { shape: "connected", label: "صـ", cls: "c-connected" },
        { shape: "final", label: "ص", cls: "c-final" }
      ].forEach((opt) => {
        const b = el("button", "letter-choice-btn " + opt.cls, opt.label);
        b.type = "button";
        b.addEventListener("click", () => choose(opt.shape));
        choices.appendChild(b);
      });
      card.appendChild(choices);

      const fb = el("div", "feedback-banner");
      card.appendChild(fb);

      function choose(shape) {
        choices.querySelectorAll("button").forEach((btn) => (btn.disabled = true));
        // الحرف الفعلي المكتوب هو نفسه دائمًا (ص)، والمتصفح يرسمه بالشكل
        // الصحيح تلقائيًا حسب موضعه بين الحروف المجاورة.
        slot.textContent = "ص";
        slot.classList.add("filled");
        speak("ص");

        const isCorrect = shape === required;
        const reason =
          required === "connected"
            ? "لأنّه يأتي بعده حرف آخر في الكلمة، فيُكتب متصلًا هكذا (صـ)."
            : "لأنّه آخر حرف في الكلمة ولا يأتي بعده شيء، فيُكتب منفصلًا هكذا (ص).";

        if (isCorrect) {
          fb.textContent = "أحسنت! " + reason + " الكلمة كاملة: " + item.full;
          fb.className = "feedback-banner show ok";
          correctCount++;
          addStar();
        } else {
          fb.textContent = "تذكّر: " + reason + " الكلمة الصحيحة: " + item.full;
          fb.className = "feedback-banner show bad";
        }
        setTimeout(() => speak(item.full), 900);
        const row = el("div", "activity-actions");
        row.innerHTML = `<span></span><div class="activity-actions-right"><button class="btn btn-primary" id="btnNextItem">${
          index === opts.items.length - 1 ? "متابعة الرحلة ←" : "التالي ←"
        }</button></div>`;
        card.appendChild(row);
        row.querySelector("#btnNextItem").addEventListener("click", goNextItem);
      }
    }

    function goNextItem() {
      index++;
      if (index >= opts.items.length) {
        recordResult(opts.skillKey, correctCount, gradedTotal);
        opts.onComplete();
      } else {
        renderItem();
      }
    }

    renderItem();
  }

  /* ------------------------------------------------------------------
     6ب) نشاط استكشافي: توضيح شكل حرف الصاد المتصل والمنفصل
     ------------------------------------------------------------------ */

  function renderShapeDemo(container, opts) {
    container.innerHTML = "";
    const wrap = el("div", "activity-wrap");
    wrap.appendChild(el("div", "activity-kicker", opts.kicker));
    wrap.appendChild(el("h2", "activity-title", opts.title));
    wrap.appendChild(el("p", "activity-desc", opts.desc));
    const card = el("div", "activity-card");
    wrap.appendChild(card);
    container.appendChild(wrap);

    const demoRow = el("div", "shape-demo-row");
    opts.examples.forEach((ex) => {
      const item = el(
        "div",
        "shape-demo-item",
        `<div class="shape-demo-word">${ex.wordHtml}</div>
         <div class="shape-demo-arrow">⬇</div>
         <div class="shape-demo-glyph ${ex.glyphClass}">${ex.glyph}</div>
         <div class="shape-demo-caption">${ex.caption}</div>`
      );
      demoRow.appendChild(item);
    });
    card.appendChild(demoRow);

    const qa = el("div", "explore-qa");
    qa.innerHTML = opts.qaLines.map((l) => `<p><span class="q-label">${l.q}</span> ${l.a}</p>`).join("");
    card.appendChild(qa);

    const btnRow = el(
      "div",
      "activity-actions",
      `<span></span><div class="activity-actions-right"><button class="btn btn-primary" id="btnGo">فهمت! هيا نطبّق →</button></div>`
    );
    card.appendChild(btnRow);
    card.querySelector("#btnGo").addEventListener("click", opts.onComplete);
  }

  /* ------------------------------------------------------------------
     8) تدريب اختيار الكلمات التي تحتوي على حرف الضاد
     ------------------------------------------------------------------ */

  function renderSelectWords(container, opts) {
    container.innerHTML = "";
    const wrap = el("div", "activity-wrap");
    wrap.innerHTML = `
      <div class="activity-kicker">${opts.kicker}</div>
      <h2 class="activity-title">${opts.title}</h2>
      <p class="activity-desc">${opts.desc}</p>
      <div class="activity-card">
        <div class="select-grid" id="grid"></div>
        <div class="feedback-banner" id="fb"></div>
        <div class="activity-actions">
          <button class="btn btn-ghost" id="btnHint" type="button">تلميح 💡</button>
          <div class="activity-actions-right">
            <button class="btn btn-secondary" id="btnCheck" type="button">تحقّق ✅</button>
            <button class="btn btn-primary" id="btnNext" type="button" disabled>التالي ←</button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(wrap);

    const grid = wrap.querySelector("#grid");
    const fb = wrap.querySelector("#fb");
    const btnCheck = wrap.querySelector("#btnCheck");
    const btnNext = wrap.querySelector("#btnNext");
    const btnHint = wrap.querySelector("#btnHint");

    let checked = false;

    opts.items.forEach((item) => {
      const cardEl = el(
        "div",
        "select-card",
        item.emoji
          ? `<div style="font-size:34px;">${item.emoji}</div><div style="margin-top:6px;">${item.label}</div>`
          : item.label
      );
      cardEl.dataset.id = item.id;
      cardEl.addEventListener("click", () => {
        if (checked) return;
        speak(item.label);
        cardEl.classList.toggle("selected");
      });
      grid.appendChild(cardEl);
    });

    btnHint.addEventListener("click", () => {
      fb.textContent = opts.hint;
      fb.className = "feedback-banner show hint";
    });

    btnCheck.addEventListener("click", () => {
      if (checked) return;
      checked = true;
      let correct = 0;
      opts.items.forEach((item) => {
        const cardEl = grid.querySelector(`[data-id="${item.id}"]`);
        const isSelected = cardEl.classList.contains("selected");
        cardEl.classList.remove("selected");
        if (item.correct) {
          cardEl.classList.add(isSelected ? "correct" : "incorrect");
          cardEl.appendChild(el("span", "mark", isSelected ? "✔ فيها الحرف" : "فاتتك! فيها الحرف"));
          if (isSelected) correct++;
        } else if (isSelected) {
          cardEl.classList.add("incorrect");
          cardEl.appendChild(el("span", "mark", "✘ ليست هذه"));
        }
      });
      const total = opts.items.filter((i) => i.correct).length;
      if (opts.skillKey) recordResult(opts.skillKey, correct, total);
      addStar(correct);
      if (correct === total) {
        fb.textContent = "ممتاز! اخترت كل الكلمات الصحيحة 🌟";
        fb.className = "feedback-banner show ok";
      } else {
        fb.textContent = "أحسنت المحاولة! راجع الكلمات المميّزة أعلاه.";
        fb.className = "feedback-banner show hint";
      }
      btnCheck.disabled = true;
      btnNext.disabled = false;
    });

    btnNext.addEventListener("click", opts.onComplete);
  }

  /* ------------------------------------------------------------------
     9) تدريب تحليل الكلمة إلى حروفها
     ------------------------------------------------------------------ */

  function renderAnalyze(container, opts) {
    container.innerHTML = "";
    const wrap = el("div", "activity-wrap");
    wrap.innerHTML = `
      <div class="activity-kicker">${opts.kicker}</div>
      <h2 class="activity-title">${opts.title}</h2>
      <p class="activity-desc">${opts.desc}</p>
      <div class="activity-card" id="card"></div>
    `;
    container.appendChild(wrap);
    const card = wrap.querySelector("#card");

    let index = 0;
    let totalCorrect = 0;
    let totalLetters = 0;

    function renderWord() {
      const item = opts.items[index];
      const letters = stripHarakat(item.label).split("");
      totalLetters += letters.length;
      card.innerHTML = "";
      card.appendChild(
        el(
          "div",
          "analyze-word-title",
          item.label +
            ` <span class="speaker-icon" id="speakWord">🔊</span>  <span style="font-size:15px;color:var(--ink-soft);">(الكلمة ${
              index + 1
            } من ${opts.items.length})</span>`
        )
      );
      card.querySelector("#speakWord").addEventListener("click", () => speak(item.label));

      const boxesWrap = el("div", "analyze-boxes");
      const boxes = letters.map(() => {
        const b = el("div", "analyze-box", "");
        boxesWrap.appendChild(b);
        return b;
      });
      card.appendChild(boxesWrap);

      const tilesWrap = el("div", "analyze-tiles");
      const tileEls = shuffle(letters.map((l, i) => ({ l, i }))).map((obj) => {
        const t = el("div", "letter-tile", obj.l);
        tilesWrap.appendChild(t);
        return t;
      });
      card.appendChild(tilesWrap);

      const fb = el("div", "feedback-banner");
      card.appendChild(fb);

      let nextBoxIndex = 0;
      let wordCorrect = 0;

      tileEls.forEach((tileEl) => {
        tileEl.addEventListener("click", () => {
          if (tileEl.classList.contains("used") || nextBoxIndex >= boxes.length) return;
          const expected = letters[nextBoxIndex];
          if (tileEl.textContent === expected) {
            boxes[nextBoxIndex].textContent = expected;
            boxes[nextBoxIndex].classList.add("filled");
            tileEl.classList.add("used");
            nextBoxIndex++;
            wordCorrect++;
            addStar();
            if (nextBoxIndex === boxes.length) {
              fb.textContent = "رائع! حللت الكلمة حرفًا حرفًا 🎉";
              fb.className = "feedback-banner show ok";
              totalCorrect += wordCorrect;
              const row = el("div", "activity-actions");
              row.innerHTML = `<span></span><div class="activity-actions-right"><button class="btn btn-primary" id="btnNextWord">${
                index === opts.items.length - 1 ? "متابعة الرحلة ←" : "الكلمة التالية ←"
              }</button></div>`;
              card.appendChild(row);
              row.querySelector("#btnNextWord").addEventListener("click", goNextWord);
            }
          } else {
            tileEl.classList.add("chip-result-bad");
            setTimeout(() => tileEl.classList.remove("chip-result-bad"), 400);
            fb.textContent = "لاحظ ترتيب الحروف في الكلمة، وحاول مجددًا 🙂";
            fb.className = "feedback-banner show hint";
          }
        });
      });
    }

    function goNextWord() {
      index++;
      if (index >= opts.items.length) {
        recordResult(opts.skillKey, totalCorrect, totalLetters);
        opts.onComplete();
      } else {
        renderWord();
      }
    }

    renderWord();
  }

  /* ------------------------------------------------------------------
     11) نشاط استكشافي: عرض توضيحي لتحليل كلمة نموذجية
     ------------------------------------------------------------------ */

  function renderAnalyzeDemo(container, opts) {
    container.innerHTML = "";
    const wrap = el("div", "activity-wrap");
    wrap.innerHTML = `
      <div class="activity-kicker">${opts.kicker}</div>
      <h2 class="activity-title">${opts.title}</h2>
      <p class="activity-desc">${opts.desc}</p>
      <div class="activity-card">
        <div class="analyze-word-title">${opts.demoWord} <span class="speaker-icon" id="speakDemo">🔊</span></div>
        <div class="explore-qa">
          <p><span class="q-label">لاحظ:</span> كل كلمة تتكوّن من حروف منفصلة، وعندما نجمعها ننطق الكلمة كاملة.</p>
        </div>
        <div class="analyze-boxes" id="demoBoxes"></div>
        <div class="activity-actions">
          <span></span>
          <div class="activity-actions-right">
            <button class="btn btn-primary" id="btnNext" type="button">فهمت! هيا نجرّب →</button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(wrap);
    const boxesWrap = wrap.querySelector("#demoBoxes");
    wrap.querySelector("#speakDemo").addEventListener("click", () => speak(opts.demoWord));
    const letters = stripHarakat(opts.demoWord).split("");
    letters.forEach((l, i) => {
      const b = el("div", "analyze-box", "");
      boxesWrap.appendChild(b);
      setTimeout(() => {
        b.textContent = l;
        b.classList.add("filled");
      }, 250 * (i + 1));
    });
    wrap.querySelector("#btnNext").addEventListener("click", opts.onComplete);
  }

  /* ------------------------------------------------------------------
     12) تسلسل الخطوات الرئيسي للدرس
     ------------------------------------------------------------------ */

  const steps = [
    // 0: استكشاف س/ش
    (container, done) =>
      renderExploreIntro(container, {
        kicker: "نشاط استكشافي",
        title: "هيا نكتشف حرف السين وحرف الشين",
        desc: "انظر إلى الصور التالية، واضغط على أي بطاقة لتسمع نطق الكلمة، وفكّر في الصوت الذي تسمعه في بدايتها.",
        cards: EXPLORE_S_SH,
        qaLines: [
          { q: "ماذا ترى في الصور؟", a: "سمكة، وسيارة، وشمس، وشجرة." },
          { q: "استمع لكلمة «سمكة»:", a: "ما الصوت الذي تسمعه في بدايتها؟ إنه صوت السين (س)." },
          { q: "استمع لكلمة «شمس»:", a: "هل تسمع الصوت نفسه؟ لا، هذا صوت الشين (ش)." },
          { q: "ما الفرق بينهما؟", a: "صوت السين يخرج هادئًا، وصوت الشين فيه صفير أوسع قليلًا." }
        ],
        letters: [
          { text: "س", colorClass: "c-s", sound: "صوت السين" },
          { text: "ش", colorClass: "c-sh", sound: "صوت الشين" }
        ],
        columns: [
          { id: "s", title: "حرف س" },
          { id: "sh", title: "حرف ش" }
        ],
        hint: "استمع جيدًا لأول صوت في اسم كل صورة.",
        onComplete: done
      }),

    // 1: تدريب التصنيف (تدريب الكتاب الأول)
    (container, done) =>
      renderClassify(container, {
        kicker: "التدريب الأول",
        title: "نقرأ ونصنّف الكلمات الآتية في الجدول",
        desc: "اسحب كل كلمة إلى العمود المناسب لها: حرف (س) أو حرف (ش).",
        chips: DRILL_CLASSIFY,
        columns: [
          { id: "s", title: "حَرْفُ (س)" },
          { id: "sh", title: "حَرْفُ (ش)" }
        ],
        showEmoji: false,
        hint: "اقرأ الكلمة بصوت مسموع، وانتبه للحرف الذي تسمعه.",
        skillKey: "classify",
        onComplete: done
      }),

    // 2: استكشاف شكل حرف الصاد (متصل / منفصل)
    (container, done) =>
      renderShapeDemo(container, {
        kicker: "نشاط استكشافي",
        title: "هل يتغيّر شكل الحرف الواحد؟",
        desc: "انظر إلى حرف الصاد في الكلمتين التاليتين، وقارن بين شكليه.",
        examples: SHAPE_DEMO_EXAMPLES,
        qaLines: [
          { q: "لاحظ:", a: "حرف الصاد هو نفس الحرف في الكلمتين، لكن شكله يتغيّر قليلًا." },
          { q: "إذا جاء بعده حرف آخر في الكلمة:", a: "يُكتب متصلًا وله امتداد صغير، هكذا: (صـ)." },
          { q: "إذا كان هو آخر حرف في الكلمة:", a: "يُكتب منفصلًا بدون امتداد، هكذا: (ص)." }
        ],
        onComplete: done
      }),

    // 3: تدريب كتابة شكل الحرف الصحيح (تدريب الكتاب الثاني)
    (container, done) =>
      renderFillBlank(container, {
        kicker: "التدريب الثاني",
        title: "نكتب حرف الصاد بالشكل المناسب في الكلمات الآتية",
        desc: "اختر الشكل الصحيح لحرف الصاد: متصل (صـ) إن جاء بعده حرف، أو منفصل (ص) إن كان آخر الكلمة.",
        items: DRILL_FILLBLANK,
        skillKey: "fillblank",
        onComplete: done
      }),

    // 4: استكشاف ص/ض قبل تدريب الاختيار
    (container, done) =>
      renderExploreIntro(container, {
        kicker: "نشاط استكشافي",
        title: "هيا نكتشف حرف الصاد وحرف الضاد",
        desc: "انظر إلى الصور التالية، واضغط على أي بطاقة لتسمع نطق الكلمة، وتعرّف على اسم كل شيء.",
        cards: EXPLORE_S_D,
        qaLines: [
          { q: "ماذا ترى في الصور؟", a: "صقر، وصندوق، وضفدع، وضرس." },
          { q: "استمع لكلمة «صقر»:", a: "هذا صوت الصاد (ص)، صوت قوي يخرج من طرف اللسان." },
          { q: "استمع لكلمة «ضفدع»:", a: "هذا صوت الضاد (ض)، صوت أعمق قليلًا." },
          { q: "هل تستطيع تمييز الفرق؟", a: "لنجرّب معًا في اللعبة التالية!" }
        ],
        letters: [
          { text: "ص", colorClass: "c-ss", sound: "صوت الصاد" },
          { text: "ض", colorClass: "c-dd", sound: "صوت الضاد" }
        ],
        columns: [
          { id: "ss", title: "حرف ص" },
          { id: "dd", title: "حرف ض" }
        ],
        hint: "صوت الضاد أعمق وأثقل قليلًا من صوت الصاد.",
        onComplete: done
      }),

    // 5: تدريب الاختيار (تدريب الكتاب الثالث)
    (container, done) =>
      renderSelectWords(container, {
        kicker: "التدريب الثالث",
        title: "نقرأ ونلوّن المستطيل الذي يحتوي على كلمة فيها حرف (ض)",
        desc: "اضغط على كل كلمة تحتوي على حرف (ض)، ثم اضغط زر تحقّق.",
        items: DRILL_SELECT,
        skillKey: "select",
        hint: "احذر! كلمة «الصَّغير» فيها حرف (ص) وليس (ض).",
        onComplete: done
      }),

    // 6: استكشاف تمهيدي لتحليل الحروف
    (container, done) =>
      renderAnalyzeDemo(container, {
        kicker: "نشاط استكشافي",
        title: "هيا نحلّل كلمة إلى حروفها",
        desc: "شاهد كيف تتحول الكلمة إلى حروف منفصلة، كل حرف في صندوقه الخاص.",
        demoWord: "قَلَم",
        onComplete: done
      }),

    // 7: تدريب تحليل الكلمات (تدريب الكتاب الرابع)
    (container, done) =>
      renderAnalyze(container, {
        kicker: "التدريب الرابع",
        title: "نقرأ ونحلّل الكلمات الآتية",
        desc: "اضغط على الحروف بالترتيب الصحيح لتضعها في صناديقها.",
        items: DRILL_ANALYZE,
        skillKey: "analyze",
        onComplete: done
      })
  ];

  /* ------------------------------------------------------------------
     13) التنقل بين الخطوات
     ------------------------------------------------------------------ */

  function updateProgress() {
    const pct = Math.round((state.stepIndex / steps.length) * 100);
    progressFill.style.width = pct + "%";
  }

  function goToStep(i) {
    if (i >= steps.length) {
      finishLesson();
      return;
    }
    state.stepIndex = i;
    updateProgress();
    saveProgress();
    showScreen("activity");
    steps[i](screens.activity, () => goToStep(i + 1));
  }

  function finishLesson() {
    updateProgress();
    progressFill.style.width = "100%";
    const finishStats = document.getElementById("finishStats");
    const finishGood = document.getElementById("finishGood");
    const finishReview = document.getElementById("finishReview");

    let sumCorrect = 0,
      sumTotal = 0;
    finishGood.innerHTML = "";
    finishReview.innerHTML = "";

    Object.values(state.results).forEach((r) => {
      sumCorrect += r.correct;
      sumTotal += r.total;
      const ratio = r.total > 0 ? r.correct / r.total : 0;
      const li = el("li", "", r.label + (r.total > 0 ? ` (${r.correct}/${r.total})` : ""));
      if (r.total === 0) return;
      if (ratio >= 0.7) finishGood.appendChild(li);
      else finishReview.appendChild(li);
    });

    finishStats.innerHTML = `
      <div class="stat"><b>${steps.length}</b><span>أنشطة مكتملة</span></div>
      <div class="stat"><b>${sumCorrect}/${sumTotal}</b><span>إجابات صحيحة</span></div>
      <div class="stat"><b>⭐ ${state.stars}</b><span>نجوم</span></div>
    `;

    clearProgress();
    showScreen("finish");
  }

  function resetLesson() {
    state.stepIndex = 0;
    state.stars = 0;
    Object.keys(state.results).forEach((k) => {
      state.results[k].correct = 0;
      state.results[k].total = 0;
    });
    starsBadge.textContent = "⭐ 0";
    progressFill.style.width = "0%";
    clearProgress();
    const resumeBtn = document.getElementById("btnResume");
    if (resumeBtn) resumeBtn.remove();
  }

  /**
   * نافذة تأكيد بسيطة مبنية بالكامل داخل الصفحة (بدلًا من confirm()
   * الافتراضية في المتصفح، التي قد لا تعمل داخل بعض عارضات المعاينة).
   */
  function showConfirm(message, onYes) {
    const overlay = el("div", "modal-overlay");
    const box = el(
      "div",
      "modal-box",
      `<p>${message}</p><div class="modal-actions">
         <button class="btn btn-ghost" id="mCancel" type="button">إلغاء</button>
         <button class="btn btn-primary" id="mOk" type="button">نعم، إعادة البدء</button>
       </div>`
    );
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    box.querySelector("#mCancel").addEventListener("click", () => overlay.remove());
    box.querySelector("#mOk").addEventListener("click", () => {
      overlay.remove();
      onYes();
    });
  }

  /* ------------------------------------------------------------------
     14) ربط الأزرار الثابتة
     ------------------------------------------------------------------ */

  document.getElementById("btnStart").addEventListener("click", () => {
    showScreen("overview");
  });
  document.getElementById("btnOverviewNext").addEventListener("click", () => {
    goToStep(0);
  });
  document.getElementById("btnRestartTop").addEventListener("click", () => {
    showConfirm("هل تريد إعادة الدرس من البداية؟ سيتم مسح كل النقاط والنتائج الحالية.", () => {
      resetLesson();
      showScreen("welcome");
    });
  });
  document.getElementById("btnFinishRestart").addEventListener("click", () => {
    resetLesson();
    showScreen("welcome");
  });
  document.getElementById("btnFinishReview").addEventListener("click", () => {
    resetLesson();
    showScreen("overview");
  });

  /* ------------------------------------------------------------------
     15) نقطة البداية
     ------------------------------------------------------------------ */

  const saved = loadProgress();
  if (saved && (saved.stepIndex > 0 || saved.stars > 0)) {
    state.stars = saved.stars || 0;
    starsBadge.textContent = "⭐ " + state.stars;
    if (saved.results) Object.assign(state.results, saved.results);
    const btnResume = el("button", "btn btn-secondary btn-big", "تابع من حيث توقفت ↩");
    btnResume.id = "btnResume";
    btnResume.style.marginTop = "14px";
    btnResume.addEventListener("click", () => goToStep(saved.stepIndex || 0));
    document.querySelector(".welcome-card").appendChild(btnResume);
  }

  showScreen("welcome");
})();
