import _ from 'lodash';
import type { Metadata } from 'next';

import { ApiStoreProvider } from '@/providers';

import { fetchSEOData } from '../layout';

export async function generateMetadata({ params }: { params: { uid: string } }): Promise<Metadata> {
  const { uid } = await params;
  const seoData = await fetchSEOData(`/${uid}`);

  const metaImage = seoData
    ? seoData.metas.find((meta: any) => meta.name === 'og:image')?.content
    : 'https://tbk.foundation/default-og-image.jpg';

  return {
    title: _.get(seoData, 'title', `${uid.toUpperCase()} PAGE`),
    description: seoData
      ? seoData.metas.find((meta: any) => meta.name === 'description')?.content
      : 'Default description for TBK Foundation.',
    openGraph: {
      title: seoData?.title ?? `${uid.toUpperCase()} PAGE`,
      description: seoData
        ? seoData.metas.find((meta: any) => meta.name === 'description')?.content
        : 'Default description for TBK Foundation.',
      url: `https://tbk.foundation/${uid}`,
      images: [
        {
          url: metaImage,
          alt: _.get(seoData, 'title', 'TBK Foundation'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: seoData?.title ?? 'TBK Foundation',
      description: seoData
        ? seoData.metas.find((meta: any) => meta.name === 'description')?.content
        : 'Default description for TBK Foundation.',
      images: [metaImage || 'https://tbk.foundation/default-og-image.jpg'],
    },
  };
}

export default function UidLayout({ children }: { children: React.ReactNode }) {
  return <ApiStoreProvider>{children}</ApiStoreProvider>;
}
