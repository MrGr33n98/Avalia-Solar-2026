import { GET_HOME_DATA } from '../../../lib/queries/home';
import { print } from 'graphql';

describe('Home Queries', () => {
  it('should have a valid GET_HOME_DATA query structure', () => {
    expect(GET_HOME_DATA).toBeDefined();
    const queryStr = print(GET_HOME_DATA);
    
    expect(queryStr).toContain('query GetHomeData');
    expect(queryStr).toContain('banners');
    expect(queryStr).toContain('categories');
    expect(queryStr).toContain('companies');
    expect(queryStr).toContain('articles');
    
    // Fragments
    expect(queryStr).toContain('fragment CompanyFields');
    expect(queryStr).toContain('fragment CategoryFields');
    expect(queryStr).toContain('fragment BannerFields');
    expect(queryStr).toContain('sponsored');
    expect(queryStr).toContain('fragment ArticleFields');
  });

  it('should include all required fields for companies', () => {
    const queryStr = print(GET_HOME_DATA);
    expect(queryStr).toContain('logoUrl');
    expect(queryStr).toContain('ratingAvg');
    expect(queryStr).toContain('reviewsCount');
  });
});
