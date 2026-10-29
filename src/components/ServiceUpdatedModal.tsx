import { useEffect, useRef } from 'react'

/** 공용 설정 메이저 버전이 바뀌어 다시 로그인해야 할 때 띄우는 안내 모달 */
export function ServiceUpdatedModal({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="service-updated-title"
      className="w-[min(24rem,calc(100vw-2rem))] rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 text-neutral-800 dark:text-neutral-100 shadow-xl backdrop:bg-black/40"
    >
      <h2 id="service-updated-title" className="text-lg font-semibold">
        서비스가 업데이트되었습니다.
      </h2>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        더 나은 서비스를 위해 저장된 정보를 초기화했어요. 다시 로그인해 주세요.
      </p>
      <form method="dialog" className="mt-5 flex justify-end">
        <button type="submit" className="btn" autoFocus>
          확인
        </button>
      </form>
    </dialog>
  )
}
