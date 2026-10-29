import { useParams } from 'react-router-dom'
import { ArticleOneView, hasArticleComponent } from '@/components/board/ArticleOneView.tsx'
import { TargetThreads } from '@/components/TargetThreads.tsx'
import { boardPath } from '@/lib/boards.ts'

/** /board/:slug/:id — 게시글 + (Opinion 이면) 대화록 */
export default function ArticleDetailPage() {
  const { slug = '', id = '' } = useParams<{ slug: string; id: string }>()

  return (
    <ArticleOneView slug={slug} id={id}>
      {(item, board) =>
        hasArticleComponent(item, 'Opinion') && (
          <TargetThreads
            target={{ entity: 'Article', id: item._id, path: `${boardPath(board)}/${item._id}` }}
          />
        )
      }
    </ArticleOneView>
  )
}
