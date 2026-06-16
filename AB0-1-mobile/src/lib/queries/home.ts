import { gql } from '@apollo/client';

export const COMPANY_FRAGMENT = gql`
  fragment CompanyFields on Company {
    id
    name
    slug
    logoUrl
    city
    state
    ratingAvg
    reviewsCount
    isVerified
    isFeatured
    isSponsored
  }
`;

export const CATEGORY_FRAGMENT = gql`
  fragment CategoryFields on Category {
    id
    name
    slug
    iconUrl
  }
`;

export const BANNER_FRAGMENT = gql`
  fragment BannerFields on Banner {
    id
    title
    imageUrl
    linkUrl
  }
`;

export const ARTICLE_FRAGMENT = gql`
  fragment ArticleFields on Article {
    id
    title
    slug
    excerpt
    coverUrl
    publishedAt
  }
`;

export const GET_HOME_DATA = gql`
  query GetHomeData($city: String, $state: String) {
    banners(position: "home_top", city: $city, state: $state, limit: 5) {
      ...BannerFields
    }
    categories(featured: true, limit: 10) {
      ...CategoryFields
    }
    companies(featured: true, city: $city, state: $state, limit: 10) {
      nodes {
        ...CompanyFields
      }
    }
    articles(perPage: 5) {
      nodes {
        ...ArticleFields
      }
    }
  }
  ${BANNER_FRAGMENT}
  ${CATEGORY_FRAGMENT}
  ${COMPANY_FRAGMENT}
  ${ARTICLE_FRAGMENT}
`;
