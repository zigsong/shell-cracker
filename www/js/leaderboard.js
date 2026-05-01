// ─── 리더보드 (Supabase) ───
// 값은 web빌드: .env.local / 모바일빌드: www/js/config.js 에서 주입됩니다
const Leaderboard = {
  _client: null,
  _currentId: null,

  init() {
    try {
      if (!this._client) {
        if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
          console.error("supabase-config.js가 로드되지 않았습니다.");
          return;
        }
        this._client = supabase.createClient(
          window.SUPABASE_URL,
          window.SUPABASE_ANON_KEY
        );
      }
    } catch (e) {
      console.error("Supabase 초기화 실패", e);
    }
  },

  _randomNickname() {
    const num = String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
    return `수달${num}`;
  },

  async submitScore(score) {
    this._currentId = null;

    // 닉네임은 Supabase와 무관하게 즉시 세팅
    const nickname = this._randomNickname();
    const input = document.getElementById("lbNicknameInput");
    if (input) input.value = nickname;

    if (!this._client) {
      await this._renderBoard();
      return;
    }

    try {
      const { data, error } = await this._client
        .from("scores")
        .insert({ nickname, score })
        .select("id")
        .single();

      if (!error && data) this._currentId = data.id;
    } catch (e) {
      console.error("점수 저장 실패", e);
    }

    await this._renderBoard();
  },

  async cancelScore() {
    if (!this._currentId || !this._client) return;
    try {
      await this._client.from("scores").delete().eq("id", this._currentId);
    } catch (e) {
      console.error("점수 취소 실패", e);
    }
    this._currentId = null;
  },

  async updateNickname() {
    if (!this._currentId) return;
    const input = document.getElementById("lbNicknameInput");
    const name = input.value.trim();
    if (!name) return;

    try {
      await this._client
        .from("scores")
        .update({ nickname: name })
        .eq("id", this._currentId);
    } catch (e) {
      console.error("닉네임 변경 실패", e);
    }

    await this._renderBoard();
  },

  async _renderBoard() {
    const tbody = document.getElementById("lbTbody");
    if (!this._client) {
      tbody.innerHTML = `<tr><td colspan="3" class="lb-loading">연결 안됨</td></tr>`;
      return;
    }
    tbody.innerHTML = `<tr><td colspan="3" class="lb-loading">불러오는 중...</td></tr>`;

    try {
      const { data, error } = await this._client
        .from("scores")
        .select("id, nickname, score")
        .order("score", { ascending: false })
        .limit(5);

      if (error) {
        console.error("리더보드 조회 오류:", error);
        tbody.innerHTML = `<tr><td colspan="3" class="lb-loading">불러오기 실패: ${error.message}</td></tr>`;
        return;
      }

      tbody.innerHTML = "";
      if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="lb-loading">아직 기록이 없어요</td></tr>`;
        return;
      }

      data.forEach((row, i) => {
        const tr = document.createElement("tr");
        if (row.id === this._currentId) tr.classList.add("lb-mine");
        tr.innerHTML = `<td>${i + 1}</td><td>${row.nickname}</td><td>${row.score}</td>`;
        tbody.appendChild(tr);
      });
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="3" class="lb-loading">불러오기 실패</td></tr>`;
    }
  },
};
