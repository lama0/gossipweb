import NewsletterPage from "./newsletter-page";
export default async function Page({params}:{params:Promise<{category:string}>}){const{category}=await params;return <NewsletterPage category={category}/>}
