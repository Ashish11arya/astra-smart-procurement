import { redirect } from 'next/navigation';

export default function RedirectWeighment({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const tab = searchParams?.tab;
  redirect(`/operations/weighment${tab ? `?tab=${tab}` : ''}`);
}
