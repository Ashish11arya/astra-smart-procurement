import { redirect } from 'next/navigation';

export default async function RedirectWeighment({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const tab = params?.tab;
  redirect(`/operations/weighment${tab ? `?tab=${tab}` : ''}`);
}
