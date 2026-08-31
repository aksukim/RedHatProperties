export interface Listing {
  id: string;
  address: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  acres: number;
  description: string;
  image: string;
  tags: string[];
  status: 'active' | 'under_contract' | 'pending' | 'sold';
  mlsNumber?: string;
  zillowUrl?: string;
}

export interface SoldListing extends Listing {
  soldPrice: number;
  soldDate: string;
}

export interface ListingsData {
  active: Listing[];
  sold: SoldListing[];
  bought: SoldListing[];
}
