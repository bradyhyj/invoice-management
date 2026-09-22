<script>
  import { fade, slide } from "svelte/transition";
  export let message = "";
  export let type = "success"; // "success" | "error" | "info"

  // 타입에 따른 색상 및 아이콘 결정
  $: isSuccess = type === "success";
  $: isError = type === "error";
  $: bgColor = isSuccess ? "bg-emerald-500" : isError ? "bg-red-500" : "bg-indigo-500";
  $: icon = isSuccess ? "✓" : isError ? "!" : "i";
</script>

<div 
  in:slide={{ duration: 300 }} 
  out:fade={{ duration: 200 }}
  class="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 {bgColor} text-white rounded-lg shadow-xl print:hidden max-w-sm"
>
  <div class="flex items-center justify-center w-6 h-6 bg-white/20 rounded-full font-bold text-sm shrink-0">
    {icon}
  </div>
  <div class="font-medium text-sm leading-snug">
    {message}
  </div>
</div>