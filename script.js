(() => {
  "use strict";

  // Team 4 is the first project in Chain B.
  const TEAM_ID = "4";
  const CHAIN_ID = "B";
  const DATAPIPE_EXPERIMENT_ID = "gZZ1nvUDsmz4";
  const NEXT_PROJECT_URL = "https://laurenbier.github.io/Memory-on-trial/";
  const DATAPIPE_URL = "https://pipe.jspsych.org/api/data/";

  const $ = (id) => document.getElementById(id);
  const screens = ["welcome", "videoScreen", "postScreen", "questionScreen", "feedbackScreen", "resultsScreen"];
  const show = (id) => screens.forEach((screen) => $(screen).classList.toggle("hidden", screen !== id));
  const now = () => new Date().toISOString();

  function makeSessionId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID().replace(/-/g, "").toUpperCase();
    }
    const bytes = new Uint8Array(16);
    if (window.crypto && typeof window.crypto.getRandomValues === "function") {
      window.crypto.getRandomValues(bytes);
      return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
    }
    // Last-resort fallback for older browsers; no identifying information is used.
    return (`${Date.now().toString(16)}${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`)
      .replace(/[^a-f0-9]/gi, "").slice(0, 32).toUpperCase();
  }

  // FIRST-project rule: create exactly one new sid at the beginning of this project.
  const sessionId = makeSessionId();
  const sessionStart = now();

  const clip = Math.random() < 0.5 ? "stop" : "yield";
  const misinformation = Math.random() < 0.5 ? "misleading" : "accurate";
  const feedbackCondition = Math.random() < 0.5 ? "confirming" : "neutral";
  const sign = clip === "stop" ? "STOP" : "YIELD";
  const wrongSign = clip === "stop" ? "YIELD" : "STOP";
  const signAccurate = `The intersection had a ${sign} sign.`;
  const signMisleading = `The intersection had a ${wrongSign} sign.`;
  const directionAccurate = "A dark sedan approached from the left, while a white SUV approached from the right.";
  const directionMisleading = "A white SUV approached from the left, while a dark sedan approached from the right.";
  const questions = [
    { id: "road_sign", text: "Which road sign was visible at the intersection?", options: ["STOP sign", "YIELD sign", "Traffic light", "No sign was visible"], correct: clip === "stop" ? "STOP sign" : "YIELD sign", misinformationOptions: [wrongSign + " sign"] },
    { id: "left_vehicle", text: "Which vehicle approached the intersection from the left side of the video?", options: ["A dark sedan", "A white SUV", "A red pickup truck", "A bus"], correct: "A dark sedan", misinformationOptions: ["A white SUV"] },
    { id: "right_vehicle", text: "Which vehicle approached the intersection from the right side of the video?", options: ["A dark sedan", "A white SUV", "A red pickup truck", "A bus"], correct: "A white SUV", misinformationOptions: ["A dark sedan"] },
    { id: "event_outcome", text: "What happened between the two vehicles?", options: ["They collided at the intersection", "They stopped safely without contact", "One vehicle made a U-turn", "They passed through without interacting"], correct: "They collided at the intersection", misinformationOptions: [] }
  ];

  const answers = [];
  const trials = [];
  let qIndex = 0;
  let videoWatched = false;
  let postConfidence = null;
  let startedAt = null;
  let videoStartedAt = null;
  let postShownAt = null;
  let completedAt = null;
  let summaryCSV = "";
  let trialsCSV = "";
  let uploadInProgress = false;
  let saveSucceeded = false;
  let retryAttempted = false;

  const video = $("eventVideo");
  $("videoSource").src = clip === "stop" ? "accident_stop.mp4" : "accident_yield.mp4";
  video.load();

  $("beginBtn").addEventListener("click", () => {
    startedAt = now();
    show("videoScreen");
    video.play().catch(() => {
      $("videoStatus").textContent = "If the video does not start automatically, check your browser settings and reload the page.";
    });
  });

  video.addEventListener("ended", () => {
    videoWatched = true;
    $("videoStatus").textContent = "Video complete. You may continue.";
    $("videoContinue").disabled = false;
  });
  video.addEventListener("play", () => {
    if (!videoStartedAt) videoStartedAt = now();
  });

  $("videoContinue").addEventListener("click", () => {
    if (!videoWatched) return;
    const post = misinformation === "accurate"
      ? `${signAccurate} ${directionAccurate} The vehicles collided in the intersection.`
      : `${signMisleading} ${directionMisleading} The vehicles collided in the intersection.`;
    $("socialText").textContent = post;
    postShownAt = now();
    show("postScreen");
  });

  $("postContinue").addEventListener("click", () => {
    qIndex = 0;
    renderQuestion();
    show("questionScreen");
  });

  function renderQuestion() {
    const question = questions[qIndex];
    $("questionCount").textContent = `Question ${qIndex + 1} of ${questions.length}`;
    $("questionProgress").style.width = `${((qIndex + 1) / questions.length) * 100}%`;
    $("questionText").textContent = question.text;
    $("answerOptions").innerHTML = "";
    $("nextQuestion").disabled = true;

    question.options.forEach((option) => {
      const label = document.createElement("label");
      label.className = "option";
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "answer";
      radio.value = option;
      radio.addEventListener("change", () => { $("nextQuestion").disabled = false; });
      const span = document.createElement("span");
      span.textContent = option;
      label.append(radio, span);
      $("answerOptions").append(label);
    });
    $("nextQuestion").textContent = qIndex === questions.length - 1 ? "Submit answers" : "Next question";
  }

  $("questionForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const selected = document.querySelector('input[name="answer"]:checked');
    if (!selected) return;
    const question = questions[qIndex];
    answers.push({
      question_id: question.id,
      question: question.text,
      response: selected.value,
      correct: selected.value === question.correct,
      misinformation_consistent: question.misinformationOptions.includes(selected.value)
    });
    qIndex += 1;
    if (qIndex < questions.length) renderQuestion();
    else showFeedbackScreen();
  });

  function showFeedbackScreen() {
    $("feedbackMessage").textContent = feedbackCondition === "confirming"
      ? "Your responses appear highly consistent with the event details. You did a very good job identifying what happened."
      : "Your responses have been recorded. Thank you for completing the memory questions.";
    show("feedbackScreen");
  }

  $("postConfidence").addEventListener("input", () => {
    $("postConfidenceValue").textContent = $("postConfidence").value;
  });

  function csvCell(value) {
    if (value === null || value === undefined) return "";
    const stringValue = String(value);
    return /[",\r\n]/.test(stringValue) ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
  }

  function rowsToCSV(rows) {
    if (!rows.length) return "";
    const headers = Object.keys(rows[0]);
    return [headers.join(","), ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(","))].join("\r\n");
  }

  function downloadCSV(filename, csvText) {
    if (!csvText) return;
    const blob = new Blob(["\uFEFF" + csvText], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function buildAndDisplayResults() {
    completedAt = now();
    const correctCount = answers.filter((answer) => answer.correct).length;
    const falseMemoryCount = answers.filter((answer) => answer.misinformation_consistent && !answer.correct).length;

    const summary = {
      session_id: sessionId,
      team_id: TEAM_ID,
      chain_id: CHAIN_ID,
      session_start: sessionStart,
      started_at: startedAt,
      completed_at: completedAt,
      clip_condition: clip,
      sign_shown: sign,
      information_condition: misinformation,
      feedback_condition: feedbackCondition,
      post_feedback_confidence: postConfidence,
      memory_accuracy_count: correctCount,
      memory_accuracy_percent: correctCount / questions.length * 100,
      misinformation_consistent_errors: falseMemoryCount,
      video_started_at: videoStartedAt,
      post_shown_at: postShownAt,
      video_watched_to_end: videoWatched
    };

    answers.forEach((answer, index) => {
      trials.push({
        session_id: sessionId,
        team_id: TEAM_ID,
        chain_id: CHAIN_ID,
        trial_number: index + 1,
        clip_condition: clip,
        information_condition: misinformation,
        feedback_condition: feedbackCondition,
        question_id: answer.question_id,
        question: answer.question,
        response: answer.response,
        correct_answer: questions[index].correct,
        correct: answer.correct,
        misinformation_consistent: answer.misinformation_consistent,
        post_feedback_confidence: postConfidence
      });
    });

    window.studySummary = summary;
    window.studyTrials = trials;
    summaryCSV = rowsToCSV([summary]);
    trialsCSV = rowsToCSV(trials);

    $("resultSummary").innerHTML = `
      <div class="result-grid">
        <div class="metric"><strong>${correctCount} / 4</strong><span>Correct answers</span></div>
        <div class="metric"><strong>${Math.round(correctCount / 4 * 100)}%</strong><span>Memory accuracy</span></div>
        <div class="metric"><strong>${postConfidence}</strong><span>Confidence after feedback</span></div>
      </div>`;
    show("resultsScreen");
  }

  async function sendCsvToDataPipe(filename, csvText, isRetry) {
    const response = await fetch(DATAPIPE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        experimentID: DATAPIPE_EXPERIMENT_ID,
        filename,
        data: csvText
      })
    });

    const responseBody = await response.json().catch(() => ({}));
    if (response.status === 201 || response.status === 202) return;

    // A FILE_EXISTS response is considered success only during a manual retry,
    // which handles the case where an earlier attempt stored the file but the
    // browser did not receive/observe the successful response.
    if (isRetry && response.status === 400 && responseBody.error === "FILE_EXISTS") return;

    throw new Error(responseBody.error || `HTTP_${response.status}`);
  }

  async function saveAndRedirect(isRetry = false) {
    if (uploadInProgress || saveSucceeded) return;
    uploadInProgress = true;
    $("finishBtn").disabled = true;
    $("retrySave").disabled = true;
    $("saveFailure").classList.add("hidden");
    $("saveStatus").classList.remove("success", "failure");
    $("saveStatus").textContent = isRetry ? "Retrying save…" : "Saving your responses…";

    const files = [
      { filename: `summary_${sessionId}.csv`, data: summaryCSV },
      { filename: `trials_${sessionId}.csv`, data: trialsCSV }
    ];

    try {
      // Sequential uploads make it clear which file failed and avoid duplicate
      // concurrent requests. The participant is not redirected until both pass.
      for (const file of files) {
        await sendCsvToDataPipe(file.filename, file.data, isRetry);
      }

      saveSucceeded = true;
      $("saveStatus").classList.add("success");
      $("saveStatus").textContent = "Your responses were saved successfully. Continuing to the next activity…";
      $("completionMessage").textContent = "Your responses have been saved. You will now continue to the next activity.";
      const next = new URL(NEXT_PROJECT_URL);
      next.searchParams.set("sid", sessionId);
      next.searchParams.set("chain", CHAIN_ID);
      window.setTimeout(() => window.location.assign(next.toString()), 1200);
    } catch (error) {
      uploadInProgress = false;
      $("saveStatus").classList.add("failure");
      $("saveStatus").textContent = "Automatic saving failed. Your responses are still available on this page.";
      $("saveFailure").classList.remove("hidden");
      $("saveErrorText").textContent = `We couldn't save every file to the study data store (${error.message}). Please retry. If retrying does not work, download both CSV backup files and contact the researcher.`;
      $("retrySave").disabled = false;
      retryAttempted = true;
    }
  }

  $("finishBtn").addEventListener("click", () => {
    if (answers.length !== questions.length || postConfidence !== null) return;
    postConfidence = Number($("postConfidence").value);
    buildAndDisplayResults();
    saveAndRedirect(false);
  });

  $("retrySave").addEventListener("click", () => {
    if (retryAttempted) saveAndRedirect(true);
  });

  $("downloadSummary").addEventListener("click", () => {
    downloadCSV(`summary_${sessionId}.csv`, summaryCSV);
  });
  $("downloadTrials").addEventListener("click", () => {
    downloadCSV(`trials_${sessionId}.csv`, trialsCSV);
  });
})();