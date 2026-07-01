
import { MetadataRoute } from 'next'
import { getExploreProductsApi } from '@/lib/api/publicProducts'
import { getPublicBlogPostsApi } from '@/lib/api/blog'
import { getCollectionHierarchyApi } from '@/lib/api/publicCollections'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://athleticforce1.com'

  // Fetch all products
  let productEntries: MetadataRoute.Sitemap = []
  try {
    const productsRes = await getExploreProductsApi({ pageSize: 1000 })
    if (productsRes.ok) {
      productEntries = productsRes.items.map((product) => ({
        url: `${baseUrl}/products/${product.slug}`,
        lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    }
  } catch (error) {
    console.error('Sitemap: Error fetching products', error)
  }

  // Fetch all blog posts
  let blogEntries: MetadataRoute.Sitemap = []
  try {
    const blogsRes = await getPublicBlogPostsApi({ limit: 1000 })
    if (blogsRes.ok) {
      blogEntries = blogsRes.posts.map((post: any) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }))
    }
  } catch (error) {
    console.error('Sitemap: Error fetching blogs', error)
  }

  // Fetch all collections and sub-collections for tactical indexing
  let collectionEntries: MetadataRoute.Sitemap = []
  try {
    const hierarchyRes = await getCollectionHierarchyApi()
    if (hierarchyRes.ok && hierarchyRes.hierarchy) {
      hierarchyRes.hierarchy.forEach((parent) => {
        // Parent Collection Page
        collectionEntries.push({
          url: `${baseUrl}/collections/${parent.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.9,
        })

        // Sub-Collection Pages
        parent.subcategories.forEach((sub: any) => {
          collectionEntries.push({
            url: `${baseUrl}/collections/${parent.slug}/${sub.slug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
          })
        })
      })
    }
  } catch (error) {
    console.error('Sitemap: Error fetching collections', error)
  }

  // Static pages
  const staticPages = [
    '',
    '/shop',
    '/blog',
    '/about',
    '/contact',
    '/privacy-policy',
    '/terms-and-conditions',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1 : 0.5,
  }))

  return [...staticPages, ...collectionEntries, ...productEntries, ...blogEntries]
}
