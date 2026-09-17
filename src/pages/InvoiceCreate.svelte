<script>
  // @ts-nocheck <- 타입 검사 중지

  import DocumentForm from '../components/DocumentForm.svelte';
  
  let items = []; // 새 문서니까 빈 배열로 시작
  
  function handleSave() {
    // Firebase에 'invoice' 컬렉션으로 새 문서 저장하는 로직
  }
</script>

<!-- 공통 A4 용지 껍데기를 불러오고, 타입과 데이터만 전달 -->
<DocumentForm 
  type="invoice" 
  bind:items={items} 
  onSave={handleSave} 
/>