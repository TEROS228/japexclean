import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { getProductById, getProductByUrl } from "@/lib/rakuten";
import { useCart } from "@/context/CartContext";
import { useNotification } from "@/context/NotificationContext";
import { useCurrency } from "@/context/CurrencyContext";
import ProductLoadingOverlay from "@/components/ProductLoadingOverlay";
import FavouriteButton from "@/components/FavouriteButton";

interface VariantValue {
  value: string;
  itemCode: string;
  isAvailable?: boolean;
  price?: number;
}

interface Variant {
  optionName: string;
  values: VariantValue[];
}

interface RakutenVariant {
  name: string;
  value: string;
  isAvailable: boolean;
}

// Заглушка для изображений
const PLACEHOLDER_IMAGE = "/placeholder.png";

export default function ProductPage({ product: initialProduct }: { product: any }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { showNotification } = useNotification();
  const { formatPrice } = useCurrency();
  const { itemCode } = router.query;

  const [product, setProduct] = useState(initialProduct || null);
  const [loading, setLoading] = useState(!initialProduct);
  const [mainImage, setMainImage] = useState(PLACEHOLDER_IMAGE);
  const [quantity, setQuantity] = useState(1);
  const [minLoadingTime, setMinLoadingTime] = useState(true); // Минимальное время показа анимации
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Логируем postageFlag для отладки
  useEffect(() => {
    if (product) {
      console.log('[Product Page] postageFlag:', product.postageFlag, 'type:', typeof product.postageFlag);
      console.log('[Product Page] Full product data:', {
        itemCode: product.itemCode,
        itemName: product.itemName,
        itemPrice: product.itemPrice,
      });
    }
  }, [product]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string }>({});
  const [loadingVariants, setLoadingVariants] = useState(!!initialProduct);
  const [variantError, setVariantError] = useState<string | null>(null);
  const [colorSizeMapping, setColorSizeMapping] = useState<Record<string, Array<{ value: string; available: boolean }>>>({});
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewsUnavailable, setReviewsUnavailable] = useState(false);
  const [optionsFromUrl, setOptionsFromUrl] = useState<{ [key: string]: string } | null>(null);

  // Обработка URL параметров для автовыбора опций
  useEffect(() => {
    if (router.isReady && router.query.options) {
      try {
        const decodedOptions = JSON.parse(decodeURIComponent(router.query.options as string));
        setOptionsFromUrl(decodedOptions);
      } catch (e) {
        console.error('Failed to parse options from URL:', e);
      }
    }
  }, [router.isReady, router.query.options]);

  // Улучшить качество изображений Yahoo товара
  const enhanceYahooProductImages = (product: any) => {
    if (product._source !== 'yahoo') return product;

    const upgradeYahooImageUrl = (url: string): string => {
      if (!url) return '';

      let upgraded = url.replace(/^http:/, 'https:');

      if (upgraded.includes('_ex=')) {
        upgraded = upgraded.replace(/_ex=\d+x\d+/, '_ex=600x600');
      } else if (upgraded.includes('?')) {
        upgraded += '&_ex=600x600';
      } else {
        upgraded += '?_ex=600x600';
      }

      return upgraded;
    };

    const imageId = product._yahooData?.imageId;

    // Используем только одно изображение в максимальном качестве
    let enhancedImageUrl = product.imageUrl;

    if (imageId) {
      // Используем только максимальный размер
      enhancedImageUrl = upgradeYahooImageUrl(`https://item-shopping.c.yimg.jp/i/j/${imageId}`);
    } else if (product.imageUrl) {
      enhancedImageUrl = upgradeYahooImageUrl(product.imageUrl);
    }

    const enhancedMediumUrls = [{ imageUrl: enhancedImageUrl }];

    console.log('[Product Page] Enhanced Yahoo image in high quality');

    return {
      ...product,
      imageUrl: enhancedImageUrl,
      mediumImageUrls: enhancedMediumUrls,
    };
  };

  // Минимальное время показа анимации
  useEffect(() => {
    if (!initialProduct) {
      const timer = setTimeout(() => {
        setMinLoadingTime(false);
      }, 800); // 800мс минимум показа анимации

      return () => clearTimeout(timer);
    } else {
      setMinLoadingTime(false);
    }
  }, [initialProduct]);

  // Проверяем sessionStorage и загружаем Yahoo товары через API
  useEffect(() => {
    let mounted = true;

    const loadYahooProduct = async () => {
      if (typeof window === 'undefined' || !itemCode || !router.isReady) {
        return;
      }

      // Если есть initialProduct, используем его
      if (initialProduct) {
        console.log('[Product Page] Using initialProduct:', initialProduct.itemName);
        if (mounted) {
          setProduct(initialProduct);
          setLoading(false);
        }
        return;
      }

      console.log('[Product Page] No initialProduct, loading from client...');
      if (mounted) setLoading(true);

      // Проверяем sessionStorage для Yahoo товаров
      const yahooProductKey = `yahoo-product-${itemCode}`;
      const savedYahooProduct = sessionStorage.getItem(yahooProductKey);

      if (savedYahooProduct) {
        try {
          let yahooProduct = JSON.parse(savedYahooProduct);

          console.log('[Product Page] Loading Yahoo product from sessionStorage:', yahooProduct.itemName, 'price:', yahooProduct.itemPrice);
          console.log('[Product Page] Image URL from sessionStorage:', yahooProduct.imageUrl);

          // Устанавливаем товар сразу
          if (mounted) {
            setProduct(yahooProduct);
            setLoading(false);
          }

          // Проверяем, загружено ли уже изображение высокого качества со страницы
          const hasHighQualityImage = yahooProduct._highQualityImageLoaded;

          if (!hasHighQualityImage && yahooProduct.itemUrl && mounted) {
            // Загружаем изображение высокого качества со страницы в фоне
            console.log('[Product Page] Loading high quality image from Yahoo page...');

            fetch(`/api/yahoo/images?url=${encodeURIComponent(yahooProduct.itemUrl)}`)
              .then(res => res.json())
              .then(data => {
                if (data.images && data.images.length > 0 && mounted) {
                  const highQualityImage = data.images[0];
                  console.log('[Product Page] Loaded high quality image:', highQualityImage);

                  // Обновляем только изображение, сохраняя остальные данные
                  setProduct((prevProduct: any) => {
                    if (!prevProduct) return prevProduct;

                    const updatedProduct = {
                      ...prevProduct,
                      imageUrl: highQualityImage,
                      mediumImageUrls: [{ imageUrl: highQualityImage }],
                      _highQualityImageLoaded: true,
                    };

                    // Сохраняем обновленный товар в sessionStorage
                    sessionStorage.setItem(`yahoo-product-${itemCode}`, JSON.stringify(updatedProduct));

                    return updatedProduct;
                  });
                }
              })
              .catch(e => {
                console.error('[Product Page] Error loading high quality image:', e);
              });
          } else if (hasHighQualityImage) {
            console.log('[Product Page] High quality image already loaded from cache');
          }

          return;
        } catch (e) {
          console.error('[Product Page] Failed to parse from sessionStorage:', e);
        }
      } else {
        console.log('[Product Page] No Yahoo product in sessionStorage for key:', yahooProductKey);
      }

      // Если товара нет в sessionStorage, пробуем загрузить через Yahoo API
      console.log('[Product Page] Trying to load via Yahoo API...');

      try {
        const productCode = typeof itemCode === 'string' ? itemCode.split('_').pop() : itemCode;

        console.log('[Product Page] Fetching Yahoo product via API, code:', productCode);
        const res = await fetch(`/api/yahoo/product?code=${encodeURIComponent(productCode as string)}`);

        if (res.ok) {
          const yahooProduct = await res.json();

          if (yahooProduct && yahooProduct.itemCode && mounted) {
            console.log('[Product Page] Yahoo product loaded via API:', yahooProduct.itemName);
            setProduct(yahooProduct);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error('[Product Page] Failed to load Yahoo product via API:', e);
      }

      console.log('[Product Page] Product not found');
      if (mounted) setLoading(false);
    };

    loadYahooProduct();

    return () => {
      mounted = false;
    };
  }, [itemCode, initialProduct, router.isReady]);

  // Инициализация основного изображения
  useEffect(() => {
    if (product?.mediumImageUrls?.[0]?.imageUrl) {
      const imageUrl = product.mediumImageUrls[0].imageUrl.replace("?_ex=128x128", "");
      setMainImage(imageUrl);
    }
  }, [product]);

  // Загружаем отзывы
  useEffect(() => {
    if (!product?.itemCode) return;

    const fetchReviews = async () => {
      // Определяем source: если есть _source, используем его, иначе считаем что это rakuten
      const source = product._source || 'rakuten';

      console.log('[Reviews] Fetching reviews for:', product.itemCode, 'source:', source, 'itemUrl:', product.itemUrl);

      // Для Yahoo используем данные из самого товара, так как API недоступен
      if (source === 'yahoo') {
        console.log('[Reviews] Using Yahoo product data - reviewCount:', product.reviewCount, 'reviewAverage:', product.reviewAverage);
        setReviews([]);
        setAverageRating(product.reviewAverage || 0);
        setTotalReviews(product.reviewCount || 0);
        setReviewsUnavailable(true); // API недоступен, показываем только рейтинг
        setReviewsLoading(false);
        return;
      }

      // Для Rakuten загружаем отзывы через API
      setReviewsLoading(true);
      try {
        const url = new URL('/api/product/reviews', window.location.origin);
        url.searchParams.set('itemCode', product.itemCode);
        url.searchParams.set('source', source);
        if (product.itemUrl) {
          url.searchParams.set('itemUrl', product.itemUrl);
        }

        const response = await fetch(url.toString());

        console.log('[Reviews] Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('[Reviews] Received data:', data);
          setReviews(data.reviews || []);
          setAverageRating(data.averageRating || 0);
          setTotalReviews(data.totalCount || 0);
          setReviewsUnavailable(data.reviewsUnavailable || false);
        }
      } catch (error) {
        console.error('Failed to load reviews:', error);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [product?.itemCode, product?._source, product?.reviewCount, product?.reviewAverage]);

  // Загружаем варианты через API (для Rakuten и Yahoo)
  useEffect(() => {
    if (!product?.itemUrl) return;

    // Сохраняем значения в локальные переменные чтобы избежать проблем с замыканием
    const productItemCode = product.itemCode;
    const productItemUrl = product.itemUrl;
    const productSource = product._source;

    // Используем ref чтобы избежать повторных запросов
    let didCancel = false;

    async function loadVariants() {
      try {
        setLoadingVariants(true);
        setVariantError(null);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 секунд для Puppeteer с кликами

        // Используем разные API endpoints для Yahoo и Rakuten
        const apiEndpoint = productSource === 'yahoo'
          ? `/api/yahoo/variants?url=${encodeURIComponent(productItemUrl)}`
          : `/api/parse-variants?url=${encodeURIComponent(productItemUrl)}`;

        const res = await fetch(apiEndpoint, {
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        console.log('API Response:', data); // Для дебага

        if (didCancel) return; // Прекращаем если компонент размонтирован

        if (data.success && data.variants) {
          const variantsArray = data.variants as RakutenVariant[];
          console.log('Variants array:', variantsArray); // Для дебага

          // Обновляем postageFlag если есть в ответе
          if (data.postageFlag !== undefined && data.postageFlag !== null && !didCancel) {
            console.log('[Variants API] Updating postageFlag from variants API:', data.postageFlag);
            setProduct((prev: any) => {
              // Используем значение из API напрямую, так как оно более надежное
              if (prev.postageFlag === data.postageFlag) return prev;
              return {
                ...prev,
                postageFlag: data.postageFlag
              };
            });
          }

          // Сохраняем colorSizeMapping если есть
          if (data.colorSizeMapping) {
            setColorSizeMapping(data.colorSizeMapping);
            console.log('Color-Size Mapping:', data.colorSizeMapping); // Для дебага
          }

          const convertedVariants: Variant[] = [];

          // Проверяем есть ли groups (структурированные данные)
          if (data.groups && data.groups.length > 0) {
            // Используем структурированные группы
            data.groups.forEach((group: any) => {
              const values = group.options.map((opt: any) => ({
                value: opt.value,
                itemCode: `${productItemCode}_${group.name}_${opt.value}`,
                isAvailable: opt.available !== false,
                price: opt.price // Добавляем цену из парсера
              }));

              if (values.length > 0) {
                convertedVariants.push({
                  optionName: group.name,
                  values: values
                });
              }
            });
          } else {
            // Fallback: разделяем варианты на цвета и размеры
            const colorVariants = variantsArray.filter(v =>
              v.name.includes('ブラック') || v.name.includes('ブルー') ||
              v.name.includes('Black') || v.name.includes('Blue') ||
              v.name.toLowerCase().includes('color') || v.name.includes('カラー') ||
              v.name.includes('レッド') || v.name.includes('グリーン') || // Red, Green
              v.name.includes('ホワイト') || v.name.includes('イエロー') || // White, Yellow
              v.name.includes('ピンク') || v.name.includes('パープル') // Pink, Purple
            );

            const sizeVariants = variantsArray.filter(v =>
              ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL', '7XL', '8XL']
                .some(size => v.name.includes(size)) ||
              v.name.includes('サイズ') || v.name.toLowerCase().includes('size') ||
              /\d+cm/i.test(v.name) || /\d+\s*（\s*cm\s*）/.test(v.name)
            );

            // Добавляем группу цветов
            if (colorVariants.length > 0) {
              convertedVariants.push({
                optionName: "Color",
                values: colorVariants.map(v => ({
                  value: v.name,
                  itemCode: `${productItemCode}_color_${v.value}`,
                  isAvailable: v.isAvailable
                }))
              });
            }

            // Добавляем группу размеров
            if (sizeVariants.length > 0) {
              convertedVariants.push({
                optionName: "Size",
                values: sizeVariants.map(v => ({
                  value: v.name,
                  itemCode: `${productItemCode}_size_${v.value}`,
                  isAvailable: v.isAvailable
                }))
              });
            }

            // Если не удалось разделить, используем общую группу
            if (convertedVariants.length === 0 && variantsArray.length > 0) {
              convertedVariants.push({
                optionName: "Options",
                values: variantsArray.map(v => ({
                  value: v.name,
                  itemCode: `${productItemCode}_option_${v.value}`,
                  isAvailable: v.isAvailable
                }))
              });
            }
          }

          setVariants(convertedVariants);
          console.log('Converted variants:', JSON.stringify(convertedVariants, null, 2)); // Для дебага

          // Проверяем, есть ли цены в вариантах
          convertedVariants.forEach(variant => {
            console.log(`[Variants] ${variant.optionName}:`, variant.values.map(v => ({
              value: v.value,
              price: v.price,
              available: v.isAvailable
            })));
          });

          // Устанавливаем значения по умолчанию (первый доступный вариант)
          const initial: { [key: string]: string } = {};
          convertedVariants.forEach(v => {
            if (v.values.length > 0) {
              const firstAvailable = v.values.find(val => val.isAvailable !== false);
              initial[v.optionName] = (firstAvailable || v.values[0]).value;
            }
          });

          // Если есть опции из URL, используем их вместо дефолтных
          if (optionsFromUrl) {
            Object.keys(optionsFromUrl).forEach(key => {
              // Проверяем что такая опция существует в вариантах
              const variant = convertedVariants.find(v => v.optionName === key);
              if (variant) {
                const valueExists = variant.values.find(val => val.value === optionsFromUrl[key]);
                if (valueExists) {
                  initial[key] = optionsFromUrl[key];
                }
              }
            });
          }

          setSelectedOptions(initial);
        } else {
          // Если вариантов нет, но товар имеет варианты в названии
          detectVariantsFromProduct();
        }
      } catch (e: any) {
        if (e.name === 'AbortError') {
          setVariantError("Request timeout. Please try again.");
        } else {
          setVariantError("Failed to load product variants");
        }
        console.error("Failed to load variants:", e);
        detectVariantsFromProduct();
      } finally {
        setLoadingVariants(false);
      }
    }

    // Функция для определения вариантов из данных товара
    const detectVariantsFromProduct = () => {
      const productName = product?.itemName || '';
      const commonSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '2XL', '3XL'];
      const commonColors = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Purple'];

      const foundSizes = commonSizes.filter(size =>
        productName.toUpperCase().includes(size.toUpperCase())
      );

      const foundColors = commonColors.filter(color =>
        productName.toLowerCase().includes(color.toLowerCase())
      );

      if (foundSizes.length > 0 || foundColors.length > 0) {
        const detectedVariants: Variant[] = [];

        if (foundSizes.length > 0) {
          detectedVariants.push({
            optionName: "Size",
            values: foundSizes.map(size => ({
              value: size,
              itemCode: `${productItemCode}_size_${size}`,
              isAvailable: true
            }))
          });
        }

        if (foundColors.length > 0) {
          detectedVariants.push({
            optionName: "Color",
            values: foundColors.map(color => ({
              value: color,
              itemCode: `${productItemCode}_color_${color}`,
              isAvailable: true
            }))
          });
        }

        setVariants(detectedVariants);

        const initial: { [key: string]: string } = {};
        detectedVariants.forEach(v => {
          if (v.values.length > 0) {
            initial[v.optionName] = v.values[0].value;
          }
        });

        // Если есть опции из URL, используем их вместо дефолтных
        if (optionsFromUrl) {
          Object.keys(optionsFromUrl).forEach(key => {
            // Проверяем что такая опция существует в вариантах
            const variant = detectedVariants.find(v => v.optionName === key);
            if (variant) {
              const valueExists = variant.values.find(val => val.value === optionsFromUrl[key]);
              if (valueExists) {
                initial[key] = optionsFromUrl[key];
              }
            }
          });
        }

        setSelectedOptions(initial);
      }
    };

    loadVariants();

    // Cleanup функция
    return () => {
      didCancel = true;
    };
  }, [product?.itemUrl, product?._source, optionsFromUrl]);

  const increase = () => setQuantity(q => q + 1);
  const decrease = () => setQuantity(q => (q > 1 ? q - 1 : 1));

  // Проверяем есть ли варианты с абсолютными ценами (например "4,160円")
  const hasAbsolutePrices = useMemo(() => {
    return variants.some(v =>
      v.values.some(val => /\(\d[\d,\s]*円\)/.test(val.value))
    );
  }, [variants]);

  // Находим максимальную абсолютную цену среди всех вариантов
  const maxAbsolutePrice = useMemo(() => {
    if (!hasAbsolutePrices) return 0;

    let maxPrice = 0;
    variants.forEach(v => {
      v.values.forEach(val => {
        const priceMatch = val.value.match(/\((\d[\d,\s]*)円\)/);
        if (priceMatch) {
          const cleaned = priceMatch[1].replace(/[,\s\u00A0\u2009\u200A]/g, '');
          const price = parseInt(cleaned);
          if (!isNaN(price) && price > maxPrice) {
            maxPrice = price;
          }
        }
      });
    });
    return maxPrice;
  }, [variants, hasAbsolutePrices]);

  // Вычисляем дополнительную цену или абсолютную цену из выбранных вариантов
  const additionalPrice = useMemo(() => {
    let price = 0;

    Object.entries(selectedOptions).forEach(([key, value]) => {
      // Сначала проверяем абсолютную цену (4,160円)
      const absolutePriceMatch = value.match(/\((\d[\d,\s]*)円\)/);
      if (absolutePriceMatch) {
        const cleaned = absolutePriceMatch[1].replace(/[,\s\u00A0\u2009\u200A]/g, '');
        const extractedPrice = parseInt(cleaned);
        if (!isNaN(extractedPrice) && extractedPrice > price) {
          price = extractedPrice;
        }
        return; // Используем абсолютную цену вместо дополнительной
      }

      // Иначе ищем дополнительную цену в формате (+¥1,000)
      const additionalPriceMatch = value.match(/\(\+¥([\d,\s]+)\)/);
      if (additionalPriceMatch) {
        const cleaned = additionalPriceMatch[1].replace(/[,\s\u00A0\u2009\u200A]/g, '');
        const extractedPrice = parseInt(cleaned);
        if (!isNaN(extractedPrice)) {
          price += extractedPrice;
        }
      }
    });

    return price;
  }, [selectedOptions]);

  // Итоговая цена товара
  const totalPrice = useMemo(() => {
    if (!product) return 0;
    const base = product.itemPrice || 0;

    // Проверяем, есть ли выбранный вариант с собственной ценой
    let variantPrice = 0;
    for (const variant of variants) {
      const selectedValue = selectedOptions[variant.optionName];
      if (selectedValue) {
        const option = variant.values.find(v => v.value === selectedValue);
        console.log('[Price Update] Checking variant:', variant.optionName, 'selected:', selectedValue, 'option:', option);
        if (option && option.price && option.price > 0) {
          variantPrice = option.price;
          console.log('[Price Update] Using variant price:', variantPrice);
          break; // Используем первую найденную цену варианта
        }
      }
    }

    // Если есть цена варианта, используем её вместо базовой
    if (variantPrice > 0) {
      console.log('[Price Update] Final price from variant:', variantPrice);
      return variantPrice;
    }

    // Если additionalPrice > 0 и есть абсолютные цены, используем additionalPrice как итоговую цену
    if (hasAbsolutePrices && additionalPrice > 0) {
      console.log('[Price Update] Final price from additional:', additionalPrice);
      return additionalPrice;
    }

    // Иначе складываем базовую цену + дополнительную
    console.log('[Price Update] Final price base + additional:', base + additionalPrice);
    return base + additionalPrice;
  }, [product?.itemPrice, additionalPrice, hasAbsolutePrices, selectedOptions, variants]);

  const handleOptionChange = (optionName: string, value: string) => {
    console.log(`\n[handleOptionChange] Called with optionName="${optionName}", value="${value}"`);
    console.log('[handleOptionChange] colorSizeMapping:', colorSizeMapping);

    setSelectedOptions(prev => {
      console.log('[handleOptionChange] Previous options:', prev);
      const newOptions = { ...prev, [optionName]: value };

      if (Object.keys(colorSizeMapping).length === 0) {
        console.log('[handleOptionChange] No colorSizeMapping, returning simple update');
        return newOptions;
      }

      // Определяем структуру mapping
      const firstKey = Object.keys(colorSizeMapping)[0];
      const isSizeFirst = variants.some(v =>
        (v.optionName.includes('Size') || v.optionName.includes('サイズ')) &&
        v.values.some(val => val.value === firstKey)
      );

      console.log('[handleOptionChange] firstKey:', firstKey, 'isSizeFirst:', isSizeFirst);

      if (isSizeFirst) {
        // Структура: colorSizeMapping[size] -> colors[]

        // Если изменился размер, выбираем первый доступный цвет для этого размера
        if (optionName.includes('Size') || optionName.includes('サイズ')) {
          console.log('[handleOptionChange] Size changed to:', value);
          const colorsForSize = colorSizeMapping[value];
          console.log('[handleOptionChange] Colors for size:', colorsForSize);

          if (colorsForSize && colorsForSize.length > 0) {
            // Находим название опции цвета
            const colorOptionName = Object.keys(newOptions).find(key => key.includes('Color') || key.includes('カラー'));
            const currentColor = colorOptionName ? newOptions[colorOptionName] : undefined;
            console.log('[handleOptionChange] Current color:', currentColor);

            const isCurrentColorAvailable = colorsForSize.find(c => c.value === currentColor && c.available);
            console.log('[handleOptionChange] Is current color available?', isCurrentColorAvailable);

            if (!isCurrentColorAvailable) {
              // Текущий цвет недоступен для выбранного размера, выбираем первый доступный
              const firstAvailable = colorsForSize.find(c => c.available);
              console.log('[handleOptionChange] First available color:', firstAvailable);

              if (firstAvailable) {
                if (colorOptionName) {
                  newOptions[colorOptionName] = firstAvailable.value;
                }
                console.log('[handleOptionChange] Changed color to:', firstAvailable.value);
              } else {
                if (colorOptionName) {
                  newOptions[colorOptionName] = '';
                }
                console.log('[handleOptionChange] No available colors, clearing selection');
              }
            }
          }
        }

        // Если изменился цвет, проверяем что он доступен для текущего размера
        if (optionName.includes('Color') || optionName.includes('カラー')) {
          // Находим название опции размера
          const sizeOptionName = Object.keys(newOptions).find(key => key.includes('Size') || key.includes('サイズ'));
          const currentSize = sizeOptionName ? newOptions[sizeOptionName] : undefined;
          if (currentSize) {
            const colorsForSize = colorSizeMapping[currentSize];
            if (colorsForSize) {
              const isColorAvailable = colorsForSize.find(c => c.value === value && c.available);
              if (!isColorAvailable) {
                // Цвет недоступен для текущего размера, выбираем первый доступный размер для этого цвета
                const sizeWithThisColor = Object.keys(colorSizeMapping).find(size => {
                  const colors = colorSizeMapping[size];
                  return colors.some(c => c.value === value && c.available);
                });
                if (sizeWithThisColor && sizeOptionName) {
                  newOptions[sizeOptionName] = sizeWithThisColor;
                }
              }
            }
          }
        }
      } else {
        // Структура: colorSizeMapping[color] -> sizes[]

        // Если изменился цвет, автоматически выбираем первый доступный размер
        if (optionName.includes('Color') || optionName.includes('カラー')) {
          console.log('[handleOptionChange] Color changed to:', value);
          const sizesForColor = colorSizeMapping[value];
          console.log('[handleOptionChange] Sizes for color:', sizesForColor);

          if (sizesForColor && sizesForColor.length > 0) {
            // Находим название опции размера
            const sizeOptionName = Object.keys(newOptions).find(key => key.includes('Size') || key.includes('サイズ'));
            const currentSize = sizeOptionName ? newOptions[sizeOptionName] : undefined;
            console.log('[handleOptionChange] Current size:', currentSize);

            const isCurrentSizeAvailable = sizesForColor.find(s => s.value === currentSize && s.available);
            console.log('[handleOptionChange] Is current size available?', isCurrentSizeAvailable);

            if (!isCurrentSizeAvailable) {
              // Текущий размер недоступен для выбранного цвета, выбираем первый доступный
              const firstAvailable = sizesForColor.find(s => s.available);
              console.log('[handleOptionChange] First available size:', firstAvailable);

              if (firstAvailable) {
                if (sizeOptionName) {
                  newOptions[sizeOptionName] = firstAvailable.value;
                }
                console.log('[handleOptionChange] Changed size to:', firstAvailable.value);
              } else {
                if (sizeOptionName) {
                  newOptions[sizeOptionName] = '';
                }
                console.log('[handleOptionChange] No available sizes, clearing selection');
              }
            }
          }
        }

        // Если изменился размер, проверяем что он доступен для текущего цвета
        if (optionName.includes('Size') || optionName.includes('サイズ')) {
          // Находим название опции цвета
          const colorOptionName = Object.keys(newOptions).find(key => key.includes('Color') || key.includes('カラー'));
          const currentColor = colorOptionName ? newOptions[colorOptionName] : undefined;
          if (currentColor) {
            const sizesForColor = colorSizeMapping[currentColor];
            if (sizesForColor) {
              const isSizeAvailable = sizesForColor.find(s => s.value === value && s.available);
              if (!isSizeAvailable) {
                // Размер недоступен для текущего цвета, выбираем первый доступный цвет для этого размера
                const colorWithThisSize = Object.keys(colorSizeMapping).find(color => {
                  const sizes = colorSizeMapping[color];
                  return sizes.some(s => s.value === value && s.available);
                });
                if (colorWithThisSize && colorOptionName) {
                  newOptions[colorOptionName] = colorWithThisSize;
                }
              }
            }
          }
        }
      }

      console.log('[handleOptionChange] Final options:', newOptions);
      return newOptions;
    });
  };

  // Функция для получения отфильтрованных вариантов с учетом выбранного цвета/размера
  const getFilteredVariants = () => {
    if (!variants || variants.length === 0) return [];

    // Если нет colorSizeMapping, возвращаем все варианты как есть
    if (Object.keys(colorSizeMapping).length === 0) {
      return variants;
    }

    // Определяем структуру mapping: Size->Color или Color->Size
    const firstKey = Object.keys(colorSizeMapping)[0];
    const isSizeFirst = variants.some(v =>
      (v.optionName.includes('Size') || v.optionName.includes('サイズ')) &&
      v.values.some(val => val.value === firstKey)
    );

    const filtered = variants.map(variant => {
      if (isSizeFirst) {
        // Структура: colorSizeMapping[size] -> colors[]

        // Обрабатываем Size варианты - обновляем доступность
        if (variant.optionName.includes('Size') || variant.optionName.includes('サイズ')) {
          const updatedValues = variant.values.map(v => {
            const colorsForSize = colorSizeMapping[v.value];
            if (colorsForSize) {
              const hasAvailableColor = colorsForSize.some(c => c.available !== false);
              return {
                ...v,
                isAvailable: hasAvailableColor
              };
            }
            return v;
          });

          return {
            ...variant,
            values: updatedValues
          };
        }

        // Обрабатываем Color варианты - фильтруем по выбранному размеру
        if (variant.optionName.includes('Color') || variant.optionName.includes('カラー')) {
          // Находим название опции размера
          const sizeOptionName = Object.keys(selectedOptions).find(key => key.includes('Size') || key.includes('サイズ'));
          const selectedSize = sizeOptionName ? selectedOptions[sizeOptionName] : undefined;

          if (selectedSize && colorSizeMapping[selectedSize]) {
            const colorsForSize = colorSizeMapping[selectedSize];
            const filteredValues = variant.values.filter(v =>
              colorsForSize.some(c => c.value === v.value)
            );

            const updatedValues = filteredValues.map(v => {
              const colorInfo = colorsForSize.find(c => c.value === v.value);
              return {
                ...v,
                isAvailable: colorInfo?.available !== false
              };
            });

            return {
              ...variant,
              values: updatedValues
            };
          }
        }
      } else {
        // Структура: colorSizeMapping[color] -> sizes[]

        // Обрабатываем Color варианты - обновляем доступность
        if (variant.optionName.includes('Color') || variant.optionName.includes('カラー')) {
          const updatedValues = variant.values.map(v => {
            const sizesForColor = colorSizeMapping[v.value];
            if (sizesForColor) {
              const hasAvailableSize = sizesForColor.some(s => s.available !== false);
              return {
                ...v,
                isAvailable: hasAvailableSize
              };
            }
            return v;
          });

          return {
            ...variant,
            values: updatedValues
          };
        }

        // Обрабатываем Size варианты - фильтруем по выбранному цвету
        if (variant.optionName.includes('Size') || variant.optionName.includes('サイズ')) {
          // Находим название опции цвета
          const colorOptionName = Object.keys(selectedOptions).find(key => key.includes('Color') || key.includes('カラー'));
          const selectedColor = colorOptionName ? selectedOptions[colorOptionName] : undefined;

          if (selectedColor && colorSizeMapping[selectedColor]) {
            const sizesForColor = colorSizeMapping[selectedColor];
            const filteredValues = variant.values.filter(v =>
              sizesForColor.some(s => s.value === v.value)
            );

            const updatedValues = filteredValues.map(v => {
              const sizeInfo = sizesForColor.find(s => s.value === v.value);
              return {
                ...v,
                isAvailable: sizeInfo?.available !== false
              };
            });

            return {
              ...variant,
              values: updatedValues
            };
          }
        }
      }

      return variant;
    });

    return filtered;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = PLACEHOLDER_IMAGE;
  };

  const handleAddToCart = () => {
    if (!product) return;

    // Определяем маркетплейс из _source или по URL изображения
    const marketplace = product._source === 'yahoo' ? 'yahoo' :
                       mainImage?.includes('yimg.jp') ? 'yahoo' : 'rakuten';

    addToCart({
      id: product.itemCode,
      title: product.itemName,
      price: totalPrice || product.itemPrice || 0,
      image: mainImage,
      quantity,
      options: selectedOptions,
      marketplace,
      itemUrl: product.itemUrl,
    });
    showNotification("Added to cart successfully!");
  };

  // Загрузка рекомендаций
  useEffect(() => {
    if (!product?.itemName) return;

    const loadRecommendations = async () => {
      setLoadingRecommendations(true);
      try {
        const res = await fetch(`/api/recommendations?itemName=${encodeURIComponent(product.itemName)}&limit=8`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.products) {
            // Фильтруем текущий товар из рекомендаций
            const filtered = data.products.filter((p: any) => p.itemCode !== product.itemCode);
            setRecommendations(filtered);
          }
        }
      } catch (error) {
        console.error('Failed to load recommendations:', error);
      } finally {
        setLoadingRecommendations(false);
      }
    };

    loadRecommendations();
  }, [product?.itemName, product?.itemCode]);

  const hasVariants = variants.length > 0;
  const canAddToCart = !loadingVariants;

  // Показываем загрузку если товар не готов ИЛИ не прошло минимальное время
  const isProductReady = product && product.itemCode && product.itemName && product.itemPrice;
  const shouldShowLoading = !isProductReady || minLoadingTime;

  if (shouldShowLoading) {
    return <ProductLoadingOverlay show={true} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 sm:gap-2 text-gray-600 hover:text-gray-900 active:text-gray-900 touch-manipulation"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-xs sm:text-sm font-medium">Back</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Левая колонка - Фотки */}
          <div className="flex flex-col">
            <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 mb-2 sm:mb-3 shadow-sm">
              <div className="aspect-square bg-white rounded-lg overflow-hidden relative">
                <img
                  src={mainImage}
                  alt={product.itemName || "Product image"}
                  className="absolute inset-0 object-contain w-full h-full"
                  onError={handleImageError}
                  style={{ maxWidth: '100%', maxHeight: '100%' }}
                />
              </div>
            </div>
            {product.mediumImageUrls && product.mediumImageUrls.length > 1 && (
              <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2">
                {product.mediumImageUrls.map((img: any, idx: number) => {
                  const imageUrl = img.imageUrl.replace("?_ex=128x128", "");
                  return (
                    <button
                      key={idx}
                      onClick={() => setMainImage(imageUrl)}
                      className={`flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 bg-white rounded border-2 overflow-hidden touch-manipulation transition-all ${
                        mainImage === imageUrl
                          ? "border-green-500 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 active:border-gray-300"
                      }`}
                    >
                      <img
                        src={imageUrl}
                        alt={`Thumbnail ${idx + 1}`}
                        className="object-contain w-full h-full p-0.5 sm:p-1"
                        onError={handleImageError}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Правая колонка - Информация */}
          <div className="space-y-2 sm:space-y-3">
            {/* Карточка продукта */}
            <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2 sm:mb-3 gap-2">
                <div className="text-[10px] sm:text-xs text-gray-500 truncate">
                  {product?.shopName || "Official Store"}
                </div>
                {product?.itemUrl && (
                  <div className="relative">
                    {/* Animated Arrow with Text */}
                    <div className="absolute top-0 right-full mr-3 sm:mr-4 flex items-center gap-1.5 sm:gap-2 pointer-events-none z-10 animate-bounce-gentle whitespace-nowrap">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[9px] sm:text-xs font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg shadow-lg relative">
                        Click here to see more info
                        <div className="absolute right-0 top-1/2 translate-x-1 -translate-y-1/2 w-2 h-2 bg-green-500 transform rotate-45"></div>
                      </div>
                      <svg
                        className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 animate-pulse flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                    </div>

                    <a
                      href={product.itemUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-red-600 hover:bg-red-700 active:bg-red-700 text-white text-[10px] sm:text-xs font-medium rounded-md transition-colors duration-150 shadow-sm hover:shadow active:shadow touch-manipulation flex-shrink-0 relative"
                    >
                      <span className="whitespace-nowrap">{product?._source === 'yahoo' ? 'Yahoo' : 'Rakuten'}</span>
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
              <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 leading-tight">
                {product?.itemName || "Unnamed Product"}
              </h1>

              {averageRating > 0 && (
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-3 h-3 sm:w-4 sm:h-4 ${star <= averageRating ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-700">{averageRating.toFixed(1)}</span>
                  <span className="text-xs sm:text-sm text-gray-500">({totalReviews.toLocaleString()})</span>
                </div>
              )}

              <div className="border-t border-gray-100 pt-2 sm:pt-3 mb-2 sm:mb-3">
                <div className="text-xl sm:text-2xl font-bold text-red-600 mb-1">
                  {formatPrice(totalPrice || 0)}
                </div>
                {additionalPrice > 0 && !hasAbsolutePrices && (
                  <div className="text-xs sm:text-sm text-gray-600 mb-1">
                    Base: {formatPrice(product?.itemPrice || 0)} + {formatPrice(additionalPrice)}
                  </div>
                )}
                {!loadingVariants && product?.postageFlag === 1 && (
                  <p className="text-[10px] sm:text-xs font-semibold text-green-600">✓ Free shipping in Japan</p>
                )}
              </div>

              {/* Варианты */}
              {loadingVariants ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-4 w-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-600">Loading variants... this may take a moment</p>
                  </div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ) : variantError ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                  <p className="text-amber-800 text-sm">{variantError}</p>
                </div>
              ) : hasVariants ? (
                getFilteredVariants().map((v, idx) => (
                  <div key={idx} className="mb-2 sm:mb-3">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-1 sm:mb-1.5">
                      {v.optionName}
                    </label>
                    <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
                      {v.values.map((val, i) => {
                        const isSoldOut = val.isAvailable === false;
                        const isSelected = selectedOptions[v.optionName] === val.value;
                        const hasPrice = val.price && val.price > 0;

                        return (
                          <button
                            key={i}
                            onClick={(e) => {
                              e.preventDefault();
                              if (isSoldOut) return;
                              const originalValue = e.currentTarget.getAttribute('data-original-value') || val.value;
                              handleOptionChange(v.optionName, originalValue);
                            }}
                            disabled={isSoldOut}
                            data-original-value={val.value}
                            className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded border-2 transition-all touch-manipulation ${
                              isSelected
                                ? 'bg-green-600 text-white border-green-600 shadow-sm'
                                : isSoldOut
                                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed line-through opacity-50'
                                : 'bg-white border-gray-300 text-gray-700 hover:border-green-500 active:border-green-500'
                            }`}
                          >
                            <div className="flex flex-col items-center">
                              <span className="text-center break-words w-full">{val.value}</span>
                              {hasPrice && (
                                <span className={`text-[10px] sm:text-xs mt-0.5 ${
                                  isSelected ? 'text-white' : 'text-gray-600'
                                }`}>
                                  {val.price && `¥${val.price.toLocaleString()}`}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : null}

              {/* Количество */}
              <div className="mb-2 sm:mb-3">
                <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-1 sm:mb-1.5">Quantity</label>
                <div className="inline-flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={decrease}
                    disabled={quantity <= 1}
                    className="px-3 sm:px-4 py-2 text-gray-600 disabled:text-gray-300 hover:bg-gray-50 active:bg-gray-50 disabled:cursor-not-allowed touch-manipulation"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="px-4 sm:px-6 py-2 text-gray-900 font-semibold border-x-2 border-gray-300 min-w-[40px] sm:min-w-[50px] text-center text-sm sm:text-base">
                    {quantity}
                  </span>
                  <button
                    onClick={increase}
                    className="px-3 sm:px-4 py-2 text-gray-600 hover:bg-gray-50 active:bg-gray-50 touch-manipulation"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Кнопки действий */}
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!canAddToCart}
                  className="flex-1 bg-green-600 hover:bg-green-700 active:bg-green-700 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-bold disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-150 shadow-md hover:shadow-lg active:shadow-lg disabled:shadow-none flex items-center justify-center gap-2 touch-manipulation"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span>Add to Cart</span>
                </button>
                {product && (
                  <FavouriteButton
                    item={{
                      itemCode: product.itemCode,
                      itemName: product.itemName,
                      itemPrice: product.itemPrice,
                      itemUrl: product.itemUrl,
                      imageUrl: mainImage !== PLACEHOLDER_IMAGE ? mainImage : product.imageUrl,
                      _source: product.itemUrl?.includes('yahoo') ? 'yahoo' : 'rakuten',
                    }}
                    size="lg"
                    className="!w-11 !h-11 sm:!w-12 sm:!h-12"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Описание - на всю ширину */}
        {product?.itemCaption && (
          <div className="mt-4 sm:mt-6 bg-white rounded-lg sm:rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-gray-50 to-white px-4 sm:px-6 py-2.5 sm:py-3 border-b border-gray-200">
              <h2 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 flex items-center gap-1.5 sm:gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                Product Description
              </h2>
            </div>
            <div className="px-4 sm:px-6 py-3 sm:py-4">
              <div className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap leading-relaxed overflow-hidden break-words">
                <style jsx>{`
                  div :global(img) {
                    max-width: 100% !important;
                    height: auto !important;
                    display: block;
                  }
                `}</style>
                {product.itemCaption}
              </div>
            </div>
          </div>
        )}

        {/* Reviews Section - только показываем полные отзывы если они есть */}
        {reviews.length > 0 && (
          <div className="mt-12 pb-12">
            <div className="border-t border-gray-100 pt-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Customer Reviews</h2>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-gray-900">{averageRating.toFixed(1)}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-5 h-5 ${star <= averageRating ? 'text-yellow-400' : 'text-gray-200'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">Based on {totalReviews.toLocaleString()} reviews</span>
                </div>
              </div>

              {reviewsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-200'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{review.reviewer}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {new Date(review.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      {review.title && (
                        <h3 className="font-medium text-gray-900 mb-1 text-sm">{review.title}</h3>
                      )}
                      <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recommendations Section */}
        {!loadingRecommendations && recommendations.length > 0 && (
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8 mt-6 sm:mt-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">You may also like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {recommendations.map((item: any) => (
                <a
                  key={item.itemCode}
                  href={`/product/${item.itemCode}${item.itemUrl ? `?url=${encodeURIComponent(item.itemUrl)}` : ''}`}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden group"
                >
                  <div className="aspect-square relative overflow-hidden bg-gray-100">
                    <img
                      src={item.imageUrl || item.mediumImageUrls?.[0]?.imageUrl || PLACEHOLDER_IMAGE}
                      alt={item.itemName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-2 sm:p-3">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2 mb-1 sm:mb-2 min-h-[2.5rem]">
                      {item.itemName}
                    </h3>
                    <div className="flex items-baseline gap-1 sm:gap-2">
                      <span className="text-sm sm:text-lg font-bold text-gray-900">
                        {formatPrice(item.itemPrice || 0)}
                      </span>
                    </div>
                    {item.reviewAverage > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`w-3 h-3 ${star <= Math.round(item.reviewAverage) ? 'text-yellow-400' : 'text-gray-200'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-xs text-gray-600">
                          ({item.reviewCount?.toLocaleString() || 0})
                        </span>
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export async function getServerSideProps(context: any) {
  const itemCode = context.params?.itemCode as string;
  const urlParam = context.query?.url;

  try {
    // Проверяем, это Yahoo или Rakuten URL
    const isYahooUrl = urlParam && typeof urlParam === 'string' && urlParam.includes('yahoo.co.jp');

    if (isYahooUrl) {
      // Для Yahoo товаров возвращаем null - данные будут загружены из sessionStorage на клиенте
      console.log("Yahoo product URL detected, will load from sessionStorage");
      return {
        props: { product: null }
      };
    }

    // Если есть URL параметр, пробуем получить товар по URL через Rakuten API
    if (urlParam && typeof urlParam === 'string') {
      console.log("Fetching product by URL via Rakuten API:", urlParam);
      const product = await getProductByUrl(urlParam);

      if (product) {
        console.log("Successfully fetched product via API:", product.itemName);
        return {
          props: { product }
        };
      }
      console.log("Product not found via API URL method, trying itemCode");
    }

    // Пробуем получить через обычный itemCode
    const product = await getProductById(itemCode);

    if (product) {
      return {
        props: { product }
      };
    }

    console.log("Product not found in API");
  } catch (e) {
    console.error("Failed to load product from API:", e);
  }

  // В крайнем случае пробуем через Puppeteer (только если есть URL)
  if (urlParam && typeof urlParam === 'string') {
    try {
      console.log("Fetching product from URL:", urlParam);
      // Импортируем puppeteer для серверного рендеринга
      const puppeteer = require('puppeteer');

      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      );

      await page.goto(urlParam, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      const product = await page.evaluate(() => {
        // Название товара - пробуем разные селекторы
        let itemName =
          document.querySelector('h1[itemprop="name"]')?.textContent?.trim() ||
          document.querySelector('h1.item_name')?.textContent?.trim() ||
          document.querySelector('.item_name h1')?.textContent?.trim() ||
          document.querySelector('h1')?.textContent?.trim() ||
          document.title?.trim() ||
          "";

        // Если название из title, очищаем от лишней информации
        if (itemName.includes('【楽天市場】')) {
          itemName = itemName.replace('【楽天市場】', '').split('：')[0].trim();
        }

        // Проверяем бесплатную доставку
        let postageFlag = 0;
        const freeShippingElements = Array.from(document.querySelectorAll('*')).filter(el => {
          const text = el.textContent?.trim() || '';
          return text === '送料無料' && el.children.length === 0;
        });
        if (freeShippingElements.length > 0) {
          postageFlag = 1;
        }

        // Цена - пробуем разные селекторы и подходы
        let itemPrice = 0;

        // Сначала пробуем найти по аттрибутам
        const priceContent = document.querySelector('[itemprop="price"]')?.getAttribute('content');
        if (priceContent) {
          itemPrice = parseInt(priceContent.replace(/[^\d]/g, "")) || 0;
        }

        // Если не нашли, ищем в тексте
        if (itemPrice === 0) {
          const priceSelectors = [
            '[itemprop="price"]',
            '.price2',
            '.price',
            '[class*="price"]',
            '#priceArea',
            '.priceArea'
          ];

          for (const selector of priceSelectors) {
            const el = document.querySelector(selector);
            if (el?.textContent) {
              const match = el.textContent.match(/[\d,]+/);
              if (match) {
                const price = parseInt(match[0].replace(/,/g, ''));
                if (price > 0) {
                  itemPrice = price;
                  break;
                }
              }
            }
          }
        }

        // Изображения товара
        const images: string[] = [];

        // Главное изображение - пробуем разные селекторы
        const mainImageSelectors = [
          '[itemprop="image"]',
          '#rakutenLimitedId_ImageMain img',
          '.item_image img',
          '.main_image img',
          'img[id*="ItemImg"]',
          'img[class*="item"]'
        ];

        for (const selector of mainImageSelectors) {
          const img = document.querySelector(selector) as HTMLImageElement;
          if (img?.src && !images.includes(img.src)) {
            let imgSrc = img.src;
            // Upgrade to largest size
            imgSrc = imgSrc
              .replace('_ex=128x128', '_ex=600x600')
              .replace('_ex=200x200', '_ex=600x600')
              .replace('_ex=300x300', '_ex=600x600');
            images.push(imgSrc);
            break;
          }
        }

        // Миниатюры товара - только из галереи
        const thumbnailSelectors = [
          '#rakutenLimitedId_thumblist img',
          '.sub_image img',
          '.thumbnail_list img',
          '.item_thumb img'
        ];

        thumbnailSelectors.forEach(selector => {
          const thumbs = document.querySelectorAll(selector);
          thumbs.forEach((img: any) => {
            let src = img.src;
            if (src && !images.includes(src) && img.width >= 50 && img.height >= 50) {
              // Upgrade to largest size
              src = src
                .replace('_ex=128x128', '_ex=600x600')
                .replace('_ex=200x200', '_ex=600x600')
                .replace('_ex=300x300', '_ex=600x600');
              images.push(src);
            }
          });
        });

        // Если нашли мало изображений, ищем все изображения товара
        if (images.length < 3) {
          const allImages = document.querySelectorAll('img[src*="tshop.r10s.jp"]');
          allImages.forEach((img: any) => {
            let src = img.src;
            // Фильтруем только изображения товара
            if (src && !images.includes(src) &&
                !src.includes('button') &&
                !src.includes('icon') &&
                !src.includes('banner') &&
                !src.includes('logo') &&
                !src.includes('header') &&
                !src.includes('footer') &&
                !src.includes('nav') &&
                !src.includes('common') &&
                !src.includes('bg_') &&
                img.naturalWidth >= 200 &&
                img.naturalHeight >= 200) {
              src = src
                .replace('_ex=128x128', '_ex=600x600')
                .replace('_ex=200x200', '_ex=600x600')
                .replace('_ex=300x300', '_ex=600x600');
              images.push(src);
            }
          });
        }

        // Ограничиваем количество изображений до 10
        if (images.length > 10) {
          images.splice(10);
        }

        // Описание
        const itemCaption =
          document.querySelector('[itemprop="description"]')?.textContent?.trim() ||
          document.querySelector('.item_desc')?.textContent?.trim() ||
          document.querySelector('.description')?.textContent?.trim() ||
          "";

        // Название магазина
        const shopName =
          document.querySelector('.shop_name')?.textContent?.trim() ||
          document.querySelector('[class*="shop"]')?.textContent?.trim() ||
          "";

        return {
          itemName,
          itemPrice,
          itemCaption,
          shopName,
          images,
          itemUrl: window.location.href,
          postageFlag,
        };
      });

      await browser.close();

      console.log("Parsed product data:", {
        itemName: product.itemName,
        itemPrice: product.itemPrice,
        imagesCount: product.images.length,
        postageFlag: product.postageFlag
      });

      const formattedProduct = {
        itemCode,
        itemName: product.itemName,
        itemPrice: product.itemPrice,
        itemCaption: product.itemCaption,
        shopName: product.shopName,
        itemUrl: product.itemUrl,
        imageUrl: product.images[0] || "",
        mediumImageUrls: product.images.map((img: string) => ({
          imageUrl: img,
        })),
        postageFlag: product.postageFlag,
      };

      console.log("Successfully fetched product:", formattedProduct.itemName);

      return {
        props: { product: formattedProduct }
      };
    } catch (urlError) {
      console.error("Failed to load product from URL:", urlError);
    }
  }

  return {
    props: { product: null }
  };
}