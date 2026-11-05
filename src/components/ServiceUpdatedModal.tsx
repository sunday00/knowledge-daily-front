import { Modal, ModalButton } from '@/components/Modal.tsx'

/** 공용 설정 메이저 버전이 바뀌어 다시 로그인해야 할 때 띄우는 안내 모달 */
export function ServiceUpdatedModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal
      open
      onClose={onClose}
      icon={<span className="text-2xl">✨</span>}
      title="서비스가 업데이트되었습니다."
      footer={
        <ModalButton variant="primary" onClick={onClose} autoFocus>
          확인
        </ModalButton>
      }
    >
      더 나은 서비스를 위해 저장된 정보를 초기화했어요. 다시 로그인해 주세요.
    </Modal>
  )
}
