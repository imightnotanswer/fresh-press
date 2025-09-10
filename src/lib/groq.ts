export const HOME_FEED = `*[_type in ["review","media"]] | order(publishedAt desc) [0...20]{
  _id, _type, title, slug, publishedAt,
  artist->{name, slug},
  "coverUrl": cover.asset->url,
  artistSiteUrl, blurb, body, videoUrl, description
}`;

export const REVIEW_BY_SLUG = `*[_type=="review" && slug.current==$slug][0]{
  _id, title, slug, publishedAt, releaseDate, blurb, artistSiteUrl, albumUrl, songTitle,
  artist->{_id, name, slug, image{asset->{url}}},
  cover{asset->{url}}, body,
  audioFile{asset->{url, originalFilename}}
}`;

export const MEDIA_BY_SLUG = `*[_type=="media" && slug.current==$slug][0]{
  _id, title, slug, publishedAt, description,
  artist->{_id, name, slug},
  videoUrl
}`;

export const RELATED_BY_ARTIST = `*[_type=="review" && artist._ref==$artistId] | order(publishedAt desc) [0...5]{ _id, title, slug, publishedAt, releaseDate }`;

export const RELATED_MEDIA_BY_ARTIST = `*[_type=="media" && artist._ref==$artistId] | order(publishedAt desc) [0...5]{ _id, title, slug, publishedAt, description }`;

export const ARTIST_BY_SLUG = `*[_type=="artist" && slug.current==$slug][0]{
  _id, name, slug, website, image{asset->{url}}
}`;

export const ARTIST_CONTENT = `*[_type in ["review","media"] && artist._ref==$artistId] | order(publishedAt desc){
  _id, _type, title, slug, publishedAt,
  "coverUrl": cover.asset->url,
  videoUrl, description
}`;

export const ALL_REVIEWS = `*[_type=="review"] | order(publishedAt desc){
  _id, _type, title, slug, publishedAt,
  artist->{name, slug},
  "coverUrl": cover.asset->url,
  artistSiteUrl, blurb, body,
  // placeholder; like counts are hydrated by Supabase on the page using initialLikeCount
}`;

export const ALL_MEDIA = `*[_type=="media"] | order(publishedAt desc){
  _id, _type, title, slug, publishedAt,
  artist->{name, slug},
  "coverUrl": cover.asset->url,
  videoUrl, description,
  tags[]->{name, slug}
}`;

export const ALL_TAGS = `*[_type=="tag"] | order(name asc){
  _id, name, slug
}`;

// Helper function to build GROQ queries with filters
export function buildReviewsQuery(filters: {
  tagIds?: string[];
  sortBy?: 'newest' | 'oldest' | 'alphabetical';
} = {}) {
  const { tagIds = [], sortBy = 'newest' } = filters;

  let filterClause = '';
  if (tagIds.length > 0) {
    // Ensure we only use string values and filter out any invalid entries
    const validTagSlugs = tagIds
      .filter(tag => typeof tag === 'string' && tag.trim() !== '')
      .map(slug => `"${slug}"`)
      .join(', ');

    if (validTagSlugs) {
      filterClause = ` && count(tags[@->slug.current in [${validTagSlugs}]]) > 0`;
    }
  }

  let orderClause = '';
  switch (sortBy) {
    case 'oldest':
      orderClause = 'publishedAt asc';
      break;
    case 'alphabetical':
      orderClause = 'title asc';
      break;
    case 'newest':
    default:
      orderClause = 'publishedAt desc';
      break;
  }

  return `*[_type=="review"${filterClause}] | order(${orderClause}) {
    _id, _type, title, slug, publishedAt,
    artist->{name, slug},
    "coverUrl": cover.asset->url,
    artistSiteUrl, blurb, body,
    tags[]->{name, slug}
  }`;
}

export function buildMediaQuery(filters: {
  tagIds?: string[];
  sortBy?: 'newest' | 'oldest' | 'alphabetical';
} = {}) {
  const { tagIds = [], sortBy = 'newest' } = filters;

  let filterClause = '';
  if (tagIds.length > 0) {
    // Ensure we only use string values and filter out any invalid entries
    const validTagSlugs = tagIds
      .filter(tag => typeof tag === 'string' && tag.trim() !== '')
      .map(slug => `"${slug}"`)
      .join(', ');

    if (validTagSlugs) {
      filterClause = ` && count(tags[@->slug.current in [${validTagSlugs}]]) > 0`;
    }
  }

  let orderClause = '';
  switch (sortBy) {
    case 'oldest':
      orderClause = 'publishedAt asc';
      break;
    case 'alphabetical':
      orderClause = 'title asc';
      break;
    case 'newest':
    default:
      orderClause = 'publishedAt desc';
      break;
  }

  return `*[_type=="media"${filterClause}] | order(${orderClause}) {
    _id, _type, title, slug, publishedAt,
    artist->{name, slug},
    "coverUrl": cover.asset->url,
    videoUrl, description,
    tags[]->{name, slug}
  }`;
}

