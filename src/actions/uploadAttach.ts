import { useApolloClient } from '@apollo/client'
import { ATTACH_PRESIGN_MUTATION, ATTACH_UPLOADED_MUTATION } from '@/graphql/mutations/attach.ts'
import { toWebp } from '@/lib/imageResize.ts'

/** 업로드할 크기들. 이름이 attach.src 의 키가 된다. (full 을 본문 표시에 쓴다) */
const ELEMENTS = [
  { name: 'full', maxSide: 1600 },
  { name: 'thumbnail', maxSide: 400 },
]

export type UploadedAttach = { id: string; name: string; src: Record<string, string> }

/**
 * 이미지 한 장 업로드: presign → 크기별 webp 를 저장소에 PUT → uploaded 로 확정.
 * 확정된 attach id 를 글의 attaches 에 넣어 보내면 된다.
 */
export function useUploadAttach() {
  const client = useApolloClient()

  return async (file: File, sortKey: number): Promise<UploadedAttach> => {
    const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : ''
    const { data: pre } = await client.mutate({
      mutation: ATTACH_PRESIGN_MUTATION,
      variables: {
        input: {
          type: 'IMAGE',
          originalName: file.name,
          originalExt: ext,
          sortKey,
          flags: [],
          links: [],
          version: '1.0',
        },
      },
    })
    const presigned = pre?.AttachMutation.attachPresign
    if (!presigned?.success) throw new Error(presigned?.message ?? '업로드 준비에 실패했습니다.')
    const { id, upload, sig } = presigned.item

    const elements = await Promise.all(
      ELEMENTS.map(async ({ name, maxSide }) => {
        const { blob, width, height } = await toWebp(file, maxSide)
        const res = await fetch(`${upload}/${name}.webp?${sig}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'image/webp', 'x-ms-blob-type': 'BlockBlob' },
          body: blob,
        })
        if (!res.ok) throw new Error(`이미지 업로드 실패 (${res.status})`)
        return { name, size: [width, height] }
      }),
    )

    const { data: done } = await client.mutate({
      mutation: ATTACH_UPLOADED_MUTATION,
      variables: { input: { _id: id, elements } },
    })
    const uploaded = done?.AttachMutation.attachUploaded
    if (!uploaded?.success) throw new Error(uploaded?.message ?? '업로드 확정에 실패했습니다.')

    // 응답 src 는 elements 순서의 url 목록이라 이름에 맞춰 묶는다.
    const src = Object.fromEntries(ELEMENTS.map((el, i) => [el.name, uploaded.item.src[i] ?? '']))
    return { id, name: file.name, src }
  }
}
