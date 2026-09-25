<script>
  // @ts-nocheck <- 타입 검사 중지
  import DocumentForm from "./components/DocumentForm.svelte"; // 만든 공통 컴포넌트 불러오기
  import DiscountModal from "./components/DiscountModal.svelte"; // 할인 공통 컴포넌트 불러오기
  import { discountPolicies } from "./lib/discountConfig.js"; // 할인 정책 JSON 불러오기
  import { Disc } from "lucide-svelte";
  import { db } from "./lib/firebase.js";
  import {
    collection,
    addDoc,
    serverTimestamp,
    query,
    orderBy,
    limit,
    getDocs,
    where,
  } from "firebase/firestore";
  import HistoryModal from "./components/HistoryModal.svelte";
  import Toast from "./components/Toast.svelte";
  import ConfirmModal from "./components/ConfirmModal.svelte";
  import { onMount } from "svelte";
  import Login from "./components/Login.svelte";
  import CustomSetModal from "./components/CustomSetModal.svelte";

  // 1. 데이터(상태) 선언부
  const now = new Date();
  let year = String(now.getFullYear());
  let month = String(now.getMonth() + 1).padStart(2, "0");
  let day = String(now.getDate()).padStart(2, "0");
  let documentNo = ""; // 문서 번호

  let stampImg = "";

  let customer = { name: "" };
  let bottomRemark = "";

  // 15칸 빈칸 배열
  // 할인 가능 여부(isDiscountable)를 통해 환경규제로 정해진 금액은 할인 걸러내기
  let items = Array(15)
    .fill()
    .map(() => ({
      name: "",
      spec: "",
      qty: "",
      price: "",
      amount: "",
      note: "",
      isDiscountable: true,
    }));

  // 잠금 및 상태 제어 로직
  let discountRowIndex = -1; // 할인이 적용된 빈칸의 인덱스
  let roundingRowIndex = -1; // 끝수 처리가 적용된 인덱스
  $: isLocked = discountRowIndex !== -1;

  function getEmptyRowIndex() {
    return items.findIndex(
      (item) =>
        !item.name &&
        !item.qty &&
        !item.price &&
        (!item.amount || item.amount === "") &&
        !item.note
    );
  }

  // 빠른 품목 추가
  const quickItems = [
    { name: "비닐쇼핑백", price: 100, isDiscountable: false, note: "" },
    { name: "종이쇼핑백", price: 200, isDiscountable: false, note: "" },
    { name: "아메리카노(HOT)", price: 3900, isDiscountable: true, note: "" },
  ];

  function addQuickItem(qItem) {
    if (isLocked)
      return showToast(
        "할인이 적용된 상태에서는 품목을 추가할 수 없습니다. 할인을 먼저 취소해주세요.",
        "error",
      );

    // 1. 추가하려는 품목이 이미 목록(items)에 존재하는지 이름으로 찾기
    const existingItemIndex = items.findIndex(item => item.name === qItem.name);
    
    if (existingItemIndex !== -1) {
      // 2. 이미 존재하는 품목이라면 수량(qty)만 1 증가
      // (DocumentForm.svelte에 정의된 반응성 로직($:)에 의해 amount는 자동 계산됨)
      items[existingItemIndex].qty = Number(items[existingItemIndex].qty) + 1;

    } else {
      // 존재하지 않는 경우라면
      const idx = getEmptyRowIndex();
      if (idx === -1) return showToast("명세서에 빈 칸이 없습니다.", "error");

      items[idx] = {
        name: qItem.name,
        spec: "EA",
        qty: 1,
        price: qItem.price,
        amount: qItem.price, // 수량*단가로 자동 계산되지만 명시적으로 넣음
        note: qItem.note,
        isDiscountable: qItem.isDiscountable,
      };
    }
    items = [...items]; // Svelte 화면 갱신
  }

  // 할인 모달 상태 및 핸들러
  let showDiscountModal = false;
  let selectedPolicy = null;

  function handleDiscountClick(policy) {
    if (isLocked && !policy.isPayment)
      return showToast(
        "이미 다른 할인이 적용되어 있습니다. 먼저 취소해주세요.",
        "error",
      );

    // 모달에 정책 데이터 넣고 창 띄우기
    selectedPolicy = policy;
    showDiscountModal = true;
  }

  // 모달에서 '할인 적용하기'를 눌렀을 때 실행될 함수
  function applyDiscountToForm(discountData) {
    const idx = getEmptyRowIndex();
    if (idx === -1) {
      showToast("명세서에 빈 칸이 없어 할인을 추가할 수 없습니다.", "error");
      return;
    }

    items[idx] = {
      name: discountData.name,
      spec: "",
      qty: 1,
      price: discountData.amount,
      amount: discountData.amount,
      note: discountData.isPayment ? "포인트결제" : "할인적용",
      isDiscountable: false,
    };

    items = [...items]; // Svelte 갱신
    if (!discountData.isPayment) {
      discountRowIndex = idx; // 일반 할인일 때만 잠금
    }
    showDiscountModal = false;
  }

  // 할인 취소 기능
  function cancelDiscount() {
    if (discountRowIndex !== -1) {
      items[discountRowIndex] = {
        name: "",
        spec: "",
        qty: "",
        price: "",
        amount: "",
        note: "",
        isDiscountable: true,
      };
      discountRowIndex = -1;
      items = [...items];
    }
  }

  // 문서 타입 상태 (토글용)
  let currentType = "invoice";

  // 앱이 처음 켜질 때 번호 따오기
  onMount(() => {
    fetchNextDocNumber();
  });

  // 견적서 <-> 명세서 전환 함수
  function toggleType() {
    currentType = currentType === "invoice" ? "quote" : "invoice";
    fetchNextDocNumber(); // 바꿀 때 마다 번호 다시 따오기
  }

  // 명세서 DB 저장 함수
  async function saveInvoice() {
    // 1. 15칸 중 이름이 비어있는 빈 칸은 제외하고 존재하는 데이터만 추려냄
    // 조건 추가) 품명(name)이 없더라도 비고(note)에 내용이 있으면 저장하도록 필터링 조건 변경
    const validItems = items.filter((item) => item.name.trim() !== "" || item.note.trim() !== "");

    // 2. 최소한의 유효성 검사 (아무것도 안 적고 저장하는 것 방지)
    if (validItems.length === 0 && !customer.name) {
      return showToast(
        "저장할 내용이 없습니다. 거래처나 품목을 먼저 입력해주세요.",
        "error",
      );
    }

    // 문서 번호 비어있는지 체크
    if (!documentNo.trim()) {
      return showToast("문서 번호를 입력해주세요.", "error");
    }

    const collectionName = currentType === "quote" ? "quotes" : "invoices";

    try {
      // 문서 번호 중복 검사(DB에 같은 문서 번호가 있는지 확인)
      const q = query(collection(db, collectionName), where("documentNo", "==", documentNo.trim()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // 이미 같은 번호가 존재하면 저장을 막고 에러 메시지 띄움
        return showToast(
          `이미 존재하는 문서 번호(${documentNo})입니다. 번호를 변경해주세요.`,
          "error"
        );
      }

    // 3. DB에 쏠 객체 만들기
    const docData = {
      docType: currentType, // 견적서(quote)인지 명세서(invoice)인지
      documentNo: documentNo, // 문서 번호
      date: `${year}-${month}-${day}`, // 예: 2026-09-18
      customerName: customer.name, // 거래처(공급받는 자) 이름
      supplier: supplier, // 우리 가게 정보
      items: validItems, // 입력한 품목 배열
      bottomRemark: bottomRemark, // 하단 비고란
      createdAt: serverTimestamp(), // 구글 서버 기준 시간
    };

      await addDoc(collection(db, collectionName), docData);
      showToast(
        `${currentType === "quote" ? "견적서" : "거래명세서"}가 성공적으로 저장되었습니다!`
      );

    } catch (e) {
      console.error("저장 에러:", e);
      showToast("데이터 저장에 실패했습니다. 관리자에게 문의하세요.", "error");
    }
  }

  /*
    거래명세서/견적서 불러오기
  */
  // 히스토리 모달 상태 관리
  let showHistoryModal = false;

  // 모달에서 문서를 선택했을 때 실행될 함수
  function loadDocFromHistory(docData) {
    // 1. 기본 정보 덮어쓰기
    currentType = docData.docType || "invoice";
    documentNo = docData.documentNo || "";
    customer.name = docData.customerName || "";
    bottomRemark = docData.bottomRemark || "";

    // 2. 날짜 쪼개서 넣기 ("2026-09-18" -> year, month, day)
    if (docData.date) {
      const [y, m, d] = docData.date.split("-");
      year = y;
      month = m;
      day = d;
    }

    // 3. 품목 데이터를 15칸 배열에 맞게 채워넣기
    let newItems = Array(15)
      .fill()
      .map(() => ({
        name: "",
        spec: "",
        qty: "",
        price: "",
        amount: "",
        note: "",
        isDiscountable: true,
      }));

    // 저장된 데이터가 있으면 앞에서부터 순서대로 덮어씌움
    docData.items.forEach((savedItem, index) => {
      if (index < 15) {
        newItems[index] = { ...savedItem };
      }
    });

    items = newItems;

    // 4. 할인 및 끝전 처리 행(Row) 위치 다시 찾아주기
    // 무조건 -1로 초기화하지 않고, 비고란이나 품명에 '할인/단수' 단어가 있는지 찾아서 인덱스를 복구한다
    discountRowIndex = items.findIndex(item => item.note === "할인적용" || item.name.includes("할인"));
    roundingRowIndex = items.findIndex(item => item.note === "자동계산" || item.name.includes("끝전"));

    showHistoryModal = false;
    showToast("문서를 성공적으로 불러왔습니다!");
  }

  /*
    토스트 알림창
  */
  // 토스트 시스템 상태 관리
  let toastMessage = "";
  let toastType = "success";
  let toastTimeout;

  // 토스트 띄우기 함수
  function showToast(msg, type = "success") {
    toastMessage = msg;
    toastType = type;

    // 기존 타이머가 있으면 지우고 새로 3초 설정
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastMessage = "";
    }, 3000);
  }

  /*
    문서 전체 초기화 버튼
  */
  // 새 양식 모달 상태 관리
  let showClearConfirm = false;

  // 실제 폼을 비우는 실행 함수
  function executeClearForm() {
    customer.name = "";
    documentNo = "";
    bottomRemark = "";

    // 15칸 빈칸 초기화
    items = Array(15)
      .fill()
      .map(() => ({
        name: "",
        spec: "",
        qty: "",
        price: "",
        amount: "",
        note: "",
        isDiscountable: true,
      }));

    discountRowIndex = -1;
    roundingRowIndex = -1;

    showClearConfirm = false; // 모달 닫기

    fetchNextDocNumber(); // 새 양식이니 새로 번호 따오기
    showToast("문서를 정상적으로 초기화하였습니다.", "info");
  }

  // 문서 번호 자동 생성 (채번) 함수
  async function fetchNextDocNumber() {
    try {
      const collectionName = currentType === "quote" ? "quotes" : "invoices";

      // DB에서 가장 최근(createdAt 내림차순) 문서 딱 1개만 가져오기
      const q = query(
        collection(db, collectionName),
        orderBy("createdAt", "desc"),
        limit(1),
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // 데이터가 아예 없으면 001번으로 시작
        documentNo = `${year}-001`;
      } else {
        const lastDoc = querySnapshot.docs[0].data();
        const lastDocNo = lastDoc.documentNo; // ex) "2026-001"

        if (lastDocNo && lastDocNo.startsWith(year)) {
          // 연도가 같으면 뒷자리에 +1
          const parts = lastDocNo.split("-");
          const numPart = parseInt(parts[1], 10);
          const nextNum = numPart + 1;
          documentNo = `${year}-${String(nextNum).padStart(3, "0")}`;
        } else {
          // 연도가 바뀌었거나 번호가 이상하면 해당 연도 001번으로 리셋
          documentNo = `${year}-001`;
        }
      }
    } catch (e) {
      console.error("번호 채번 실패:", e);
      // 에러 나면 수동으로 입력할 수 있게 비워둠
      documentNo = "";
    }
  }

  /*
    로그인 관련
  */
  let isLoggedIn = false; // 기본값은 로그인 안 됨 상태

  // 비워둔 채로 선언 (로그인 시 채워짐)
  let supplier = {
    bizNum: "",
    name: "",
    boss: "",
    address: "",
    category: "",
    type: "",
    tel: "",
    stampImg: "",
  };

  function handleLoginSuccess(storeData) {
    supplier = {
      bizNum: storeData.bizNum,
      name: storeData.name,
      boss: storeData.boss,
      address: storeData.address,
      category: storeData.category,
      type: storeData.type,
      tel: storeData.tel,
      stampImg: storeData.stampImg || "",
    };
    isLoggedIn = true;
  }



  /*
    고객 맞춤형 도넛 세트
  */
  let showCustomSetModal = false;

  function applyCustomSet({ unitPrice, count, mainAmount, remainder }) {
    const emptyIdx = items.findIndex(item => !item.name && !item.amount);
    if (emptyIdx === -1) {
      return showToast("명세서에 빈칸이 부족합니다.", "error");
    }

    // 메인 세트 품목 추가
    items[emptyIdx] = {
      name: "고객 맞춤형 도넛 세트",
      spec: "EA",
      qty: count,
      price: unitPrice,
      amount: mainAmount,
      note: "",
      isDiscountable: true
    };

    // 끝수 처리 (오버된 마이너스 금액이 있을 경우에만 추가)
    if (remainder < 0) {
      const nextEmptyIdx = items.findIndex((item, idx) => idx > emptyIdx && !item.name && !item.amount);
      if (nextEmptyIdx !== -1) {
        items[nextEmptyIdx] = {
          name: "끝수처리(절사)",
          spec: "",
          qty: "",
          price: "", 
          amount: remainder,
          note: "",
          isDiscountable: false
        };
        roundingRowIndex = nextEmptyIdx;
        showToast("맞춤형 세트 및 끝수처리가 적용되었습니다.");
      } else {
        showToast("끝수처리를 추가할 빈칸이 부족합니다.", "error");
      }
    } else {
      showToast("맞춤형 세트가 적용되었습니다.");
    }

    items = [...items];
    showCustomSetModal = false;
  }
</script>

<!-- 로그인 -->
{#if !isLoggedIn}
  <Login onLoginSuccess={handleLoginSuccess} />
{:else}
  <!-- 기존 명세서 화면(div) 렌더링 -->
  <div class="min-h-screen bg-slate-50 p-6 ...">
    <!-- 화면 최상단에 문서 타입 전환 버튼 추가 -->
    <!-- 클라우드에 저장 버튼 추가 -->
    <div class="flex justify-center gap-3 pt-6 bg-slate-50 print:hidden">
      <button
        on:click={() => (showClearConfirm = true)}
        class="px-5 py-2.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
      >
        🗑️ 문서 초기화
      </button>

      <button
        on:click={toggleType}
        class="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-sm transition-colors"
      >
        {currentType === "invoice"
          ? "🔄 견적서 모드로 전환"
          : "🔄 거래명세서 모드로 전환"}
      </button>

      <button
        on:click={saveInvoice}
        class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2"
      >
        💾 클라우드에 저장하기
      </button>

      <button
        on:click={() => (showHistoryModal = true)}
        class="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
      >
        📂 내역 불러오기
      </button>
    </div>

    <!-- 💡 관리자 컨트롤 패널 (인쇄 시 숨김) -->
    <div class="max-w-4xl mx-auto mt-4 print:hidden space-y-3">
      <!-- 🛍️ 섹션 1: 빠른 품목 추가 -->
      <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-300">
        <div class="text-sm font-bold text-slate-700 mb-2">
          🛍️ 빠른 품목 추가
        </div>
        <div class="flex gap-2 flex-wrap">
          {#each quickItems as qItem}
            <button
              on:click={() => addQuickItem(qItem)}
              class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-sm font-medium rounded"
            >
              + {qItem.name}
            </button>
          {/each}

          <button
            on:click={() => showCustomSetModal = true}
            class="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold rounded-lg transition-colors border border-indigo-200"
          >
            + 맞춤형 세트 계산기
        </button>
        </div>
      </div>

      <!-- 💸 섹션 2: 결제 및 할인 정책 -->
      <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-300">
        <div class="flex justify-between items-center mb-2">
          <div class="text-sm font-bold text-slate-700">
            💳 결제 및 할인 적용 (단일 선택)
          </div>
          {#if isLocked && discountRowIndex !== -1}
            <button
              on:click={cancelDiscount}
              class="text-xs px-3 py-1 bg-red-600 text-white rounded font-bold animate-pulse hover:bg-red-700"
            >
              ✕ 할인 취소하기
            </button>
          {/if}
        </div>

        <div class="flex gap-2 flex-wrap">
          {#if !isLocked || discountRowIndex === -1}
            <!-- JSON 데이터를 순회하며 동적으로 버튼 생성 -->
            {#each discountPolicies.dunkin as policy}
              <button
                on:click={() => handleDiscountClick(policy)}
                class="px-3 py-1.5 border text-sm font-medium rounded transition-colors {policy.buttonColor}"
              >
                {policy.name}
              </button>
            {/each}
          {:else}
            <div class="text-sm text-red-500 font-medium py-1.5">
              🔒 할인이 적용되어 폼이 잠겼습니다. 품목 추가나 다른 할인을
              원하시면 먼저 취소해주세요.
            </div>
          {/if}
        </div>
      </div>
    </div>

    <!-- 문서 본문 -->
    <DocumentForm
      type={currentType}
      bind:year
      bind:month
      bind:day
      bind:documentNo
      bind:supplier
      bind:customer
      bind:items
      bind:bottomRemark
      bind:stampImg
      {isLocked}
      {discountRowIndex}
      {roundingRowIndex}
    />
    <!-- 할인 팝업 -->
    {#if showDiscountModal}
      <DiscountModal
        policy={selectedPolicy}
        {items}
        onClose={() => (showDiscountModal = false)}
        onApply={applyDiscountToForm}
      />
    {/if}

    <!-- 거래명세서/견적서 불러오기 -->
    {#if showHistoryModal}
      <HistoryModal
        onClose={() => (showHistoryModal = false)}
        onLoad={loadDocFromHistory}
      />
    {/if}

    <!-- 토스트 알림 -->
    {#if toastMessage}
      <Toast message={toastMessage} type={toastType} />
    {/if}

    <!-- 폼 초기화 확인 모달 -->
    {#if showClearConfirm}
      <ConfirmModal
        title="문서 초기화"
        message="작성 중인 모든 내용을 지우고 초기화하시겠습니까?<br/><span class='text-red-500 font-bold'>지워진 내용은 복구할 수 없습니다.</span>"
        icon="🗑️"
        confirmText="초기화하기"
        confirmColor="bg-indigo-600 hover:bg-indigo-700"
        onConfirm={executeClearForm}
        onCancel={() => (showClearConfirm = false)}
      />
    {/if}
  </div>
{/if}


<!-- 고객 맞춤형 세트 모달 -->
{#if showCustomSetModal}
  <CustomSetModal 
    onClose={() => showCustomSetModal = false} 
    onApply={applyCustomSet}
    onError={(msg) => showToast(msg, "error")} 
  />
{/if}