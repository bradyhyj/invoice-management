<script>
  // @ts-nocheck <- 타입 검사 중지
  import { onMount } from "svelte";
  import { doc, getDoc } from "firebase/firestore";
  import { db } from "../lib/firebase"; 

  export let onLoginSuccess; 

  let loginId = "";
  let inputPassword = "";
  let errorMsg = "";
  let isLoading = false;

  // 이전에 로그인했던 아이디가 있으면 자동으로 채워줌
  onMount(() => {
    const savedId = localStorage.getItem("biz_id");
    if (savedId) loginId = savedId;
  });

  // SHA-256 해싱
  async function hashPassword(password) {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function handleLogin() {
    if (!loginId || !inputPassword) {
      errorMsg = "아이디와 비밀번호를 모두 입력해주세요.";
      return;
    }

    isLoading = true;
    errorMsg = "";

    try {
      // 입력한 아이디(예: dunkin)를 문서 이름으로 사용해 DB 검색
      const docRef = doc(db, "settings", loginId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const hashedInput = await hashPassword(inputPassword);
        
        if (data.password === hashedInput) {
          // 로그인 성공! 아이디 저장하고 App.svelte로 데이터 넘김
          localStorage.setItem("biz_id", loginId);
          onLoginSuccess(data); 
        } else {
          errorMsg = "비밀번호가 일치하지 않습니다.";
        }
      } else {
        errorMsg = "존재하지 않는 아이디입니다.";
      }
    } catch (error) {
      console.error(error);
      errorMsg = "네트워크 오류가 발생했습니다.";
    } finally {
      isLoading = false;
    }
  }

  function handleKeydown(e) {
    if (e.key === "Enter") handleLogin();
  }
</script>

<div class="fixed inset-0 bg-slate-100 flex items-center justify-center p-4 z-50">
  <div class="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center border-t-8 border-indigo-600">
    <div class="text-4xl mb-4">🍩</div>
    <h2 class="text-2xl font-black text-slate-800 mb-2">BizDocu</h2>
    <p class="text-slate-500 mb-6 text-sm">아이디와 비밀번호를 입력하세요.</p>

    <div class="space-y-4 text-left">
      <div>
        <label for="loginIdInput" class="block text-xs font-bold text-slate-500 mb-1">아이디</label>
        <input
          id="loginIdInput"
          type="text"
          bind:value={loginId}
          on:keydown={handleKeydown}
          placeholder="아이디 입력"
          class="w-full px-4 py-3 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-medium"
        />
      </div>

      <div>
        <label for="loginPwInput" class="block text-xs font-bold text-slate-500 mb-1">비밀번호</label>
        <input
          id="loginPwInput"
          type="password"
          bind:value={inputPassword}
          on:keydown={handleKeydown}
          placeholder="비밀번호 입력"
          class="w-full px-4 py-3 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-bold tracking-widest text-lg"
        />
      </div>

      {#if errorMsg}
        <p class="text-red-500 text-sm font-bold text-center mt-2">{errorMsg}</p>
      {/if}

      <button
        on:click={handleLogin}
        disabled={isLoading}
        class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 mt-4"
      >
        {isLoading ? "인증 중..." : "접속하기"}
      </button>
    </div>
  </div>
</div>