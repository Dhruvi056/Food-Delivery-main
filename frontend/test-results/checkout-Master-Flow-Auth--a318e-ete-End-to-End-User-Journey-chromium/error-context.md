# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: checkout.spec.js >> Master Flow: Auth, Shopping, and Theming >> Complete End-to-End User Journey
- Location: tests\e2e\checkout.spec.js:4:3

# Error details

```
Error: Unable to locate '.add' button. The database might be empty or Network failed. See attached screenshot.
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - navigation [ref=e4]:
      - generic [ref=e5]:
        - link "BiteBlitz" [ref=e6] [cursor=pointer]:
          - /url: /
          - img "BiteBlitz" [ref=e7]
        - list [ref=e8]:
          - listitem [ref=e9]:
            - link "Home" [ref=e10] [cursor=pointer]:
              - /url: /
              - text: Home
          - listitem [ref=e12]:
            - link "Menu" [ref=e13] [cursor=pointer]:
              - /url: /#explore-menu
          - listitem [ref=e14]:
            - link "Contact" [ref=e15] [cursor=pointer]:
              - /url: "#footer"
        - generic [ref=e16]:
          - button [ref=e18] [cursor=pointer]:
            - img [ref=e19]
          - button "Toggle theme" [ref=e22] [cursor=pointer]:
            - img [ref=e23]
          - link [ref=e29] [cursor=pointer]:
            - /url: /cart
            - img [ref=e31]
          - generic [ref=e35]:
            - button "Login" [ref=e36] [cursor=pointer]
            - button "Sign Up" [ref=e37] [cursor=pointer]
    - generic [ref=e38]:
      - generic [ref=e40]:
        - heading "Order your favourite food here" [level=2] [ref=e41]
        - paragraph [ref=e42]: Choose from a diverse menu featuring a detectable array of dishes crafted with the finest ingredients and culinary expertise. Our mission is to satisfy your cravings and elevate your dining experience, one delicious meal at a time.
        - link "View Menu" [ref=e43] [cursor=pointer]:
          - /url: "#explore-menu"
          - button "View Menu" [ref=e44]
      - generic [ref=e45]:
        - generic [ref=e46]:
          - heading "Explore our menu" [level=2] [ref=e47]
          - paragraph [ref=e48]: Choose from a diverse menu featuring a delectable array of dishes crafted to satisfy your cravings and elevate your dining experience.
        - generic [ref=e49]:
          - button "All All" [pressed] [ref=e50] [cursor=pointer]:
            - generic [ref=e52]: All
            - generic [ref=e53]: All
          - button "Filter by Salad" [ref=e55] [cursor=pointer]:
            - img "Salad" [ref=e57]
            - generic [ref=e58]: Salad
          - button "Filter by Rolls" [ref=e59] [cursor=pointer]:
            - img "Rolls" [ref=e61]
            - generic [ref=e62]: Rolls
          - button "Filter by Deserts" [ref=e63] [cursor=pointer]:
            - img "Deserts" [ref=e65]
            - generic [ref=e66]: Deserts
          - button "Filter by Sandwich" [ref=e67] [cursor=pointer]:
            - img "Sandwich" [ref=e69]
            - generic [ref=e70]: Sandwich
          - button "Filter by Cake" [ref=e71] [cursor=pointer]:
            - img "Cake" [ref=e73]
            - generic [ref=e74]: Cake
          - button "Filter by Pure Veg" [ref=e75] [cursor=pointer]:
            - img "Pure Veg" [ref=e77]
            - generic [ref=e78]: Pure Veg
          - button "Filter by Pasta" [ref=e79] [cursor=pointer]:
            - img "Pasta" [ref=e81]
            - generic [ref=e82]: Pasta
          - button "Filter by Noodles" [ref=e83] [cursor=pointer]:
            - img "Noodles" [ref=e85]
            - generic [ref=e86]: Noodles
      - generic [ref=e88]:
        - generic [ref=e90]:
          - heading "Top Dishes Near You" [level=2] [ref=e91]
          - paragraph [ref=e92]: 24 dishes found
        - generic [ref=e93]:
          - generic [ref=e94]:
            - generic [ref=e95]:
              - img "Lasagna Rolls" [ref=e96]
              - button "Add Lasagna Rolls to cart" [ref=e99] [cursor=pointer]:
                - img [ref=e100]
            - generic [ref=e101]:
              - generic [ref=e102]:
                - heading "Lasagna Rolls" [level=3] [ref=e103]
                - img "rating" [ref=e104]
              - paragraph [ref=e105]: Golden, flaky wraps filled with savory spiced ingredients and fresh veggies.
              - generic [ref=e106]:
                - img [ref=e107]
                - generic [ref=e109]: 200 Cal
              - generic [ref=e111]: ₹50
          - generic [ref=e112]:
            - generic [ref=e113]:
              - img "Garlic Mushroom" [ref=e114]
              - button "Add Garlic Mushroom to cart" [ref=e117] [cursor=pointer]:
                - img [ref=e118]
            - generic [ref=e119]:
              - generic [ref=e120]:
                - heading "Garlic Mushroom" [level=3] [ref=e121]
                - img "rating" [ref=e122]
              - paragraph [ref=e123]: Golden, flaky wraps filled with savory spiced ingredients and fresh veggies.
              - generic [ref=e124]:
                - img [ref=e125]
                - generic [ref=e127]: 180 Cal
              - generic [ref=e129]: ₹60
          - generic [ref=e130]:
            - generic [ref=e131]:
              - img "ChocolateBrownie" [ref=e132]
              - button "Add ChocolateBrownie to cart" [ref=e135] [cursor=pointer]:
                - img [ref=e136]
            - generic [ref=e137]:
              - generic [ref=e138]:
                - heading "ChocolateBrownie" [level=3] [ref=e139]
                - img "rating" [ref=e140]
              - paragraph [ref=e141]: Indulgent, handcrafted sweets perfect for satisfying your sugar cravings.
              - generic [ref=e142]:
                - img [ref=e143]
                - generic [ref=e145]: 50 Cal
              - generic [ref=e147]: ₹300
          - generic [ref=e148]:
            - generic [ref=e149]:
              - img "gulabjamun" [ref=e150]
              - button "Add gulabjamun to cart" [ref=e153] [cursor=pointer]:
                - img [ref=e154]
            - generic [ref=e155]:
              - generic [ref=e156]:
                - heading "gulabjamun" [level=3] [ref=e157]
                - img "rating" [ref=e158]
              - paragraph [ref=e159]: Indulgent, handcrafted sweets perfect for satisfying your sugar cravings.
              - generic [ref=e160]:
                - img [ref=e161]
                - generic [ref=e163]: 302 Cal
              - generic [ref=e165]: ₹200
          - generic [ref=e166]:
            - generic [ref=e167]:
              - img "malberi_icecream" [ref=e168]
              - button "Add malberi_icecream to cart" [ref=e171] [cursor=pointer]:
                - img [ref=e172]
            - generic [ref=e173]:
              - generic [ref=e174]:
                - heading "malberi_icecream" [level=3] [ref=e175]
                - img "rating" [ref=e176]
              - paragraph [ref=e177]: Indulgent, handcrafted sweets perfect for satisfying your sugar cravings.
              - generic [ref=e178]:
                - img [ref=e179]
                - generic [ref=e181]: 70 Cal
              - generic [ref=e183]: ₹252
          - generic [ref=e184]:
            - generic [ref=e185]:
              - img "rabdi" [ref=e186]
              - button "Add rabdi to cart" [ref=e189] [cursor=pointer]:
                - img [ref=e190]
            - generic [ref=e191]:
              - generic [ref=e192]:
                - heading "rabdi" [level=3] [ref=e193]
                - img "rating" [ref=e194]
              - paragraph [ref=e195]: Indulgent, handcrafted sweets perfect for satisfying your sugar cravings.
              - generic [ref=e196]:
                - img [ref=e197]
                - generic [ref=e199]: 100 Cal
              - generic [ref=e201]: ₹500
          - generic [ref=e202]:
            - generic [ref=e203]:
              - img "panna cotta strawberries" [ref=e204]
              - button "Add panna cotta strawberries to cart" [ref=e207] [cursor=pointer]:
                - img [ref=e208]
            - generic [ref=e209]:
              - generic [ref=e210]:
                - heading "panna cotta strawberries" [level=3] [ref=e211]
                - img "rating" [ref=e212]
              - paragraph [ref=e213]: Indulgent, handcrafted sweets perfect for satisfying your sugar cravings.
              - generic [ref=e214]:
                - img [ref=e215]
                - generic [ref=e217]: 8 Cal
              - generic [ref=e219]: ₹300
          - generic [ref=e220]:
            - generic [ref=e221]:
              - img "Vanila ice cream" [ref=e222]
              - button "Add Vanila ice cream to cart" [ref=e225] [cursor=pointer]:
                - img [ref=e226]
            - generic [ref=e227]:
              - generic [ref=e228]:
                - heading "Vanila ice cream" [level=3] [ref=e229]
                - img "rating" [ref=e230]
              - paragraph [ref=e231]: Indulgent, handcrafted sweets perfect for satisfying your sugar cravings.
              - generic [ref=e232]:
                - img [ref=e233]
                - generic [ref=e235]: 5 Cal
              - generic [ref=e237]: ₹50
          - generic [ref=e238]:
            - generic [ref=e239]:
              - img "Club Sandwich" [ref=e240]
              - button "Add Club Sandwich to cart" [ref=e243] [cursor=pointer]:
                - img [ref=e244]
            - generic [ref=e245]:
              - generic [ref=e246]:
                - heading "Club Sandwich" [level=3] [ref=e247]
                - img "rating" [ref=e248]
              - paragraph [ref=e249]: Toasted artisanal bread layered with premium fillings and signature house sauces.
              - generic [ref=e250]:
                - img [ref=e251]
                - generic [ref=e253]: 2 Cal
              - generic [ref=e255]: ₹70
          - generic [ref=e256]:
            - generic [ref=e257]:
              - img "BLT sandwich" [ref=e258]
              - button "Add BLT sandwich to cart" [ref=e261] [cursor=pointer]:
                - img [ref=e262]
            - generic [ref=e263]:
              - generic [ref=e264]:
                - heading "BLT sandwich" [level=3] [ref=e265]
                - img "rating" [ref=e266]
              - paragraph [ref=e267]: Toasted artisanal bread layered with premium fillings and signature house sauces.
              - generic [ref=e268]:
                - img [ref=e269]
                - generic [ref=e271]: 7 Cal
              - generic [ref=e273]: ₹100
          - generic [ref=e274]:
            - generic [ref=e275]:
              - img "Chickpea Sandwich" [ref=e276]
              - button "Add Chickpea Sandwich to cart" [ref=e279] [cursor=pointer]:
                - img [ref=e280]
            - generic [ref=e281]:
              - generic [ref=e282]:
                - heading "Chickpea Sandwich" [level=3] [ref=e283]
                - img "rating" [ref=e284]
              - paragraph [ref=e285]: Toasted artisanal bread layered with premium fillings and signature house sauces.
              - generic [ref=e286]:
                - img [ref=e287]
                - generic [ref=e289]: 10 Cal
              - generic [ref=e291]: ₹130
          - generic [ref=e292]:
            - generic [ref=e293]:
              - img "Vietnamese Banh mi Sandwich" [ref=e294]
              - button "Add Vietnamese Banh mi Sandwich to cart" [ref=e297] [cursor=pointer]:
                - img [ref=e298]
            - generic [ref=e299]:
              - generic [ref=e300]:
                - heading "Vietnamese Banh mi Sandwich" [level=3] [ref=e301]
                - img "rating" [ref=e302]
              - paragraph [ref=e303]: Toasted artisanal bread layered with premium fillings and signature house sauces.
              - generic [ref=e304]:
                - img [ref=e305]
                - generic [ref=e307]: 10 Cal
              - generic [ref=e309]: ₹160
          - generic [ref=e310]:
            - generic [ref=e311]:
              - img "vanila cherry cup cake" [ref=e312]
              - button "Add vanila cherry cup cake to cart" [ref=e315] [cursor=pointer]:
                - img [ref=e316]
            - generic [ref=e317]:
              - generic [ref=e318]:
                - heading "vanila cherry cup cake" [level=3] [ref=e319]
                - img "rating" [ref=e320]
              - paragraph [ref=e321]: Decadent, oven-fresh cakes baked to perfection with rich cream frostings.
              - generic [ref=e322]:
                - img [ref=e323]
                - generic [ref=e325]: 80 Cal
              - generic [ref=e327]: ₹60
          - generic [ref=e328]:
            - generic [ref=e329]:
              - img "strawberry cup cake" [ref=e330]
              - button "Add strawberry cup cake to cart" [ref=e333] [cursor=pointer]:
                - img [ref=e334]
            - generic [ref=e335]:
              - generic [ref=e336]:
                - heading "strawberry cup cake" [level=3] [ref=e337]
                - img "rating" [ref=e338]
              - paragraph [ref=e339]: Decadent, oven-fresh cakes baked to perfection with rich cream frostings.
              - generic [ref=e340]:
                - img [ref=e341]
                - generic [ref=e343]: 70 Cal
              - generic [ref=e345]: ₹80
          - generic [ref=e346]:
            - generic [ref=e347]:
              - img "white frosted cake" [ref=e348]
              - button "Add white frosted cake to cart" [ref=e351] [cursor=pointer]:
                - img [ref=e352]
            - generic [ref=e353]:
              - generic [ref=e354]:
                - heading "white frosted cake" [level=3] [ref=e355]
                - img "rating" [ref=e356]
              - paragraph [ref=e357]: Decadent, oven-fresh cakes baked to perfection with rich cream frostings.
              - generic [ref=e358]:
                - img [ref=e359]
                - generic [ref=e361]: 50 Cal
              - generic [ref=e363]: ₹140
          - generic [ref=e364]:
            - generic [ref=e365]:
              - img "Mango jelly" [ref=e366]
              - button "Add Mango jelly to cart" [ref=e369] [cursor=pointer]:
                - img [ref=e370]
            - generic [ref=e371]:
              - generic [ref=e372]:
                - heading "Mango jelly" [level=3] [ref=e373]
                - img "rating" [ref=e374]
              - paragraph [ref=e375]: Decadent, oven-fresh cakes baked to perfection with rich cream frostings.
              - generic [ref=e376]:
                - img [ref=e377]
                - generic [ref=e379]: 55 Cal
              - generic [ref=e381]: ₹70
          - generic [ref=e382]:
            - generic [ref=e383]:
              - img "Greek Salad" [ref=e384]
              - button "Add Greek Salad to cart" [ref=e387] [cursor=pointer]:
                - img [ref=e388]
            - generic [ref=e389]:
              - generic [ref=e390]:
                - heading "Greek Salad" [level=3] [ref=e391]
                - img "rating" [ref=e392]
              - paragraph [ref=e393]: Fresh, crisp greens tossed with seasonal vegetables and a light zesty dressing.
              - generic [ref=e394]:
                - img [ref=e395]
                - generic [ref=e397]: 120 Cal
              - generic [ref=e399]: ₹70
          - generic [ref=e400]:
            - generic [ref=e401]:
              - img "Veg Vegan Salad" [ref=e402]
              - button "Add Veg Vegan Salad to cart" [ref=e405] [cursor=pointer]:
                - img [ref=e406]
            - generic [ref=e407]:
              - generic [ref=e408]:
                - heading "Veg Vegan Salad" [level=3] [ref=e409]
                - img "rating" [ref=e410]
              - paragraph [ref=e411]: Fresh, crisp greens tossed with seasonal vegetables and a light zesty dressing.
              - generic [ref=e412]:
                - img [ref=e413]
                - generic [ref=e415]: 150 Cal
              - generic [ref=e417]: ₹60
          - generic [ref=e418]:
            - generic [ref=e419]:
              - img "Clover Salad" [ref=e420]
              - button "Add Clover Salad to cart" [ref=e423] [cursor=pointer]:
                - img [ref=e424]
            - generic [ref=e425]:
              - generic [ref=e426]:
                - heading "Clover Salad" [level=3] [ref=e427]
                - img "rating" [ref=e428]
              - paragraph [ref=e429]: Fresh, crisp greens tossed with seasonal vegetables and a light zesty dressing.
              - generic [ref=e430]:
                - img [ref=e431]
                - generic [ref=e433]: 140 Cal
              - generic [ref=e435]: ₹80
          - generic [ref=e436]:
            - generic [ref=e437]:
              - img "Chicken Salad" [ref=e438]
              - button "Add Chicken Salad to cart" [ref=e441] [cursor=pointer]:
                - img [ref=e442]
            - generic [ref=e443]:
              - generic [ref=e444]:
                - heading "Chicken Salad" [level=3] [ref=e445]
                - img "rating" [ref=e446]
              - paragraph [ref=e447]: Fresh, crisp greens tossed with seasonal vegetables and a light zesty dressing.
              - generic [ref=e448]:
                - img [ref=e449]
                - generic [ref=e451]: 220 Cal
              - generic [ref=e453]: ₹100
          - generic [ref=e454]:
            - generic [ref=e455]:
              - img "Tofu Curry Bowl" [ref=e456]
              - button "Add Tofu Curry Bowl to cart" [ref=e459] [cursor=pointer]:
                - img [ref=e460]
            - generic [ref=e461]:
              - generic [ref=e462]:
                - heading "Tofu Curry Bowl" [level=3] [ref=e463]
                - img "rating" [ref=e464]
              - paragraph [ref=e465]: Wholesome, farm-fresh vegetarian delights bursting with authentic natural flavors.
              - generic [ref=e466]:
                - img [ref=e467]
                - generic [ref=e469]: 450 Cal
              - generic [ref=e471]: ₹250
          - generic [ref=e472]:
            - generic [ref=e473]:
              - img "Creamy Tomato Penne" [ref=e474]
              - button "Add Creamy Tomato Penne to cart" [ref=e477] [cursor=pointer]:
                - img [ref=e478]
            - generic [ref=e479]:
              - generic [ref=e480]:
                - heading "Creamy Tomato Penne" [level=3] [ref=e481]
                - img "rating" [ref=e482]
              - paragraph [ref=e483]: Al dente pasta served with rich, slow-simmered sauces and Italian herbs.
              - generic [ref=e484]:
                - img [ref=e485]
                - generic [ref=e487]: 580 Cal
              - generic [ref=e489]: ₹320
          - generic [ref=e490]:
            - generic [ref=e491]:
              - img "Spicy Volcano Ramen" [ref=e492]
              - button "Add Spicy Volcano Ramen to cart" [ref=e495] [cursor=pointer]:
                - img [ref=e496]
            - generic [ref=e497]:
              - generic [ref=e498]:
                - heading "Spicy Volcano Ramen" [level=3] [ref=e499]
                - img "rating" [ref=e500]
              - paragraph [ref=e501]: Wok-tossed noodles perfectly seasoned with our signature umami sauces.
              - generic [ref=e502]:
                - img [ref=e503]
                - generic [ref=e505]: 520 Cal
              - generic [ref=e507]: ₹280
          - generic [ref=e508]:
            - generic [ref=e509]:
              - img "Cherry Tomato Pasta" [ref=e510]
              - button "Add Cherry Tomato Pasta to cart" [ref=e513] [cursor=pointer]:
                - img [ref=e514]
            - generic [ref=e515]:
              - generic [ref=e516]:
                - heading "Cherry Tomato Pasta" [level=3] [ref=e517]
                - img "rating" [ref=e518]
              - paragraph [ref=e519]: Al dente pasta served with rich, slow-simmered sauces and Italian herbs.
              - generic [ref=e520]:
                - img [ref=e521]
                - generic [ref=e523]: 100 Cal
              - generic [ref=e525]: ₹300
  - generic [ref=e526]:
    - generic [ref=e527]:
      - generic [ref=e528]:
        - img "BiteBlitz Logo" [ref=e529]
        - paragraph [ref=e530]: Lorem ipsum dolor sit, amet consectetur adipisicing elit. Cumque nostrum iure suscipit maiores non harum incidunt unde magnam molestias ipsum qui vel aut natus aspernatur ipsa dignissimos, numquam assumenda deserunt.
      - generic [ref=e532]:
        - heading "Company" [level=2] [ref=e533]
        - list [ref=e534]:
          - listitem [ref=e535] [cursor=pointer]: Home
          - listitem [ref=e536] [cursor=pointer]: About us
          - listitem [ref=e537] [cursor=pointer]: Delivery
          - listitem [ref=e538] [cursor=pointer]: Privacy Policy
      - generic [ref=e539]:
        - heading "Get in touch" [level=2] [ref=e540]
        - list [ref=e541]:
          - listitem [ref=e542] [cursor=pointer]: +91 9726927561
          - listitem [ref=e543] [cursor=pointer]: info@concatstring.com
    - separator [ref=e544]
    - paragraph [ref=e545]: Copyright 2025 @ BiteBlitz.com - All Right Reserved.
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Master Flow: Auth, Shopping, and Theming', () => {
  4  |   test('Complete End-to-End User Journey', async ({ page }) => {
  5  |     // 1. Go to the homepage
  6  |     await page.goto('/');
  7  |     
  8  |     // 2. Log in (Use UI)
  9  |     const signInButton = page.locator('button', { hasText: 'Sign In' });
  10 |     if (await signInButton.isVisible()) {
  11 |       await signInButton.click();
  12 |       await expect(page.locator('.login-popup')).toBeVisible();
  13 | 
  14 |       // Check if it's signup mode and switch to login
  15 |       const loginModeText = page.locator('.login-popup-condition span', { hasText: 'Login here' });
  16 |       if (await loginModeText.isVisible()) {
  17 |          await loginModeText.click();
  18 |       }
  19 | 
  20 |       await page.fill('input[name="email"]', 'admin@biteblitz.com');
  21 |       await page.fill('input[name="password"]', 'password123'); // Adjust based on DB state
  22 |       await page.click('button:has-text("Login")');
  23 |       
  24 |       // Wait for login to resolve and popup to leave
  25 |       await page.waitForTimeout(1000); 
  26 |     }
  27 | 
  28 |     // 3. Verify Logo and Glassmorphism Navbar
  29 |     const navbar = page.locator('nav').first();
  30 |     await expect(navbar).toBeVisible({ timeout: 5000 });
  31 |     const logoImg = page.locator('img[alt="BiteBlitz"]').first();
  32 |     await expect(logoImg).toBeVisible();
  33 | 
  34 |     // 4. Wait for Network to settle (API Fetches)
  35 |     await page.waitForLoadState('networkidle');
  36 |     await page.waitForTimeout(2000); // Account for UI animation/slide-in delays natively
  37 | 
  38 |     // Add a food item to the cart
  39 |     const addBtn = page.locator('.add').first();
  40 |     
  41 |     // Check if it mounts properly, failing gracefully after 5s to attach visual snapshot
  42 |     try {
  43 |         await addBtn.waitFor({ state: 'visible', timeout: 5000 });
  44 |     } catch (e) {
  45 |         const fallbackPic = await page.screenshot();
  46 |         await test.info().attach('failure-screenshot', { body: fallbackPic, contentType: 'image/png' });
> 47 |         throw new Error("Unable to locate '.add' button. The database might be empty or Network failed. See attached screenshot.");
     |               ^ Error: Unable to locate '.add' button. The database might be empty or Network failed. See attached screenshot.
  48 |     }
  49 |     
  50 |     // Explicitly scroll into user viewport before manipulating
  51 |     await addBtn.scrollIntoViewIfNeeded();
  52 |     await addBtn.click();
  53 |     
  54 |     // Check it reflects
  55 |     await page.goto('/cart');
  56 |     const checkoutBtn = page.locator('button', { hasText: 'PROCEED TO CHECKOUT' });
  57 |     await checkoutBtn.click();
  58 | 
  59 |     // 5. Go to /order, apply BITE20, verify total price calculation
  60 |     await expect(page).toHaveURL(/.*order/);
  61 |     
  62 |     // Assume base form filling to prevent validation errors natively
  63 |     await page.fill('input[name="firstName"]', 'QA');
  64 |     await page.fill('input[name="lastName"]', 'Automator');
  65 |     await page.fill('input[name="email"]', 'qa@biteblitz.com');
  66 |     await page.fill('input[name="street"]', '123 E2E Street');
  67 |     await page.fill('input[name="city"]', 'Testingville');
  68 |     await page.fill('input[name="state"]', 'NY');
  69 |     await page.fill('input[name="zipcode"]', '10001');
  70 |     await page.fill('input[name="country"]', 'USA');
  71 |     await page.fill('input[name="phone"]', '1234567890');
  72 | 
  73 |     // Extract subtotal securely before promo
  74 |     const subtotalText = await page.locator('.cart-total-details:first-of-type p:last-child').innerText();
  75 |     const subtotalParams = subtotalText.replace(/[^\d.]/g, ''); // Extract numerical string
  76 | 
  77 |     await page.fill('input[placeholder*="Promo Code"]', 'BITE20');
  78 |     await page.click('button:has-text("Apply")');
  79 | 
  80 |     // Verify discount logic text mounted
  81 |     const saveBadge = page.locator('.cart-total-details b', { hasText: 'You saved' });
  82 |     await expect(saveBadge).toBeVisible();
  83 |     
  84 |     // Check that the Total has dropped and is calculated correctly via countUp Hook gracefully
  85 |     await page.waitForTimeout(2000); // Wait for CountUp hook animation to finish ticking
  86 | 
  87 |     // 6. Toggle Dark Mode and verify it stays active after a refresh
  88 |     const themeBtn = page.locator('.theme-toggle-btn').first();
  89 |     await themeBtn.click();
  90 |     
  91 |     const htmlNode = page.locator('html');
  92 |     await expect(htmlNode).toHaveClass(/dark/);
  93 |     
  94 |     // Hard refresh
  95 |     await page.reload();
  96 |     await expect(htmlNode).toHaveClass(/dark/);
  97 |   });
  98 | });
  99 | 
```