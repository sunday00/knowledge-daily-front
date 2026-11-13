import { Modal, ModalButton } from '@/components/Modal.tsx'
import { REJOIN_RESTRICT_DAYS } from '@/lib/resign.ts'

/** 탈퇴하고 홈으로 왔을 때 띄우는 안내 */
export function ResignedModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal
      open
      onClose={onClose}
      icon={<span className="text-2xl">👋</span>}
      title="탈퇴되었습니다."
      footer={
        <ModalButton variant="primary" onClick={onClose} autoFocus>
          확인
        </ModalButton>
      }
    >
      그동안 이용해 주셔서 감사합니다. 같은 계정으로는 {REJOIN_RESTRICT_DAYS}일 뒤에 다시 가입할 수
      있어요.
    </Modal>
  )
}
