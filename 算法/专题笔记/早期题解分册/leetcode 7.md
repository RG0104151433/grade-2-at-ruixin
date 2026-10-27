# leetcode 7

## 678用'\*'可任意替换的情况下是否是合理的括号串

```cpp
class Solution {
public:
    bool checkValidString(string s) {
        int low = 0, high = 0;
        for (char c : s) {
            if (c == '(') {
                ++low;
                ++high;
            } else if (c == ')') {
                --low;
                --high;
            } else { // '*'
                --low;
                ++high;
            }
            if (high < 0) return false;
            if (low < 0) low = 0;
        }
        return low == 0;
    }
};
```

## 367是否是完全平方数

```cpp
class Solution {
public:
    bool isPerfectSquare(int num) {
        long long x = num;
        while (x * x > num) x = (x + num / x) / 2;
        return x * x == num;
    }
};//牛顿迭代法
```

```cpp
class Solution {
public:
    bool isPerfectSquare(int num) {
        int n = num, left = 1, right = 0;
        while (n > 0) {
            right = right * 10 + 9;
            n /= 100;
        }
        while (left < right) {
            int mid = left + (right - left) / 2;
            long long sq = (long long)mid * mid;   // 安全计算平方
            if (sq == (long long)num) return true;
            else if (sq > (long long)num) right = mid - 1;
            else left = mid + 1;
        }
        long long sq = (long long)left * left;      // 安全计算平方
        return sq == (long long)num;
    }
};
```

## 1541左一右二的括号配对下，使括号串平衡的最小添加数

* 启发：做括号类的题目时，如果依旧使用栈或数组进行操作，大概率会十分困难。其原因在于，使用栈进行操作，本质上是在找出一个具体的匹配方案，进而基于这个匹配方案找出多余的括号。而类似以下程序的解决办法则是一个逐位置即时维护的方案，不追求一个具体的括号匹配方案，而是在每个位置维护左右括号数，即时计算需要补充的括号。复杂度和实现难度明显更低。

```cpp
class Solution {
public:
    int minInsertions(string s) {
        int left=0;
        int ans=0;
        int len=s.size();
        for (int i=0;i<len;i++) {
            if (s[i]=='(') {
                left++;
                continue;
            }
            if (left>0) left--;
            else ans++;
            if (i<len-1 && s[i+1]==')') i++;
            else ans++;
        }
        return ans+left*2;
    }
};
```

## 540找出数组中只出现一次的数字

```cpp
class Solution {
public:
    int singleNonDuplicate(vector<int>& nums) {
        if (nums.size()==1) return nums[0];
        int left=0,right=nums.size()-1,len=nums.size();
        while (left<right) {
            int mid=left+(right-left)/2;
            if (mid>0 && nums[mid-1]==nums[mid]) {
                if ((right-left)%4==0) right=mid-2;
                else left=mid+1;
            }
            else if (mid<nums.size()-1 && nums[mid+1]==nums[mid]) {
                if ((right-left)%4==0) left=mid+2;
                else right=mid-1;
            }
            else return nums[mid];
        }
        return nums[left];
    }
};
```

## 4以O(log(m+n))复杂度求两个升序数组整体的中位数

```cpp
class Solution {
public:
    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {
        if (nums1.size()>nums2.size()) swap(nums1,nums2);
        int len1=nums1.size(),len2=nums2.size();
        int half=(len1+len2+1)/2;
        int left=0,right=len1;
        while (left<=right) {
            int i=left+(right-left)/2;
            int j=half-i;
            int L1=(i==0)?INT_MIN:nums1[i-1];
            int L2=(j==0)?INT_MIN:nums2[j-1];
            int R1=(i==len1)?INT_MAX:nums1[i];
            int R2=(j==len2)?INT_MAX:nums2[j];//注意不能全部都加减，且注意len不-1
            if (L1>R2) right=i-1;
            else if (L2>R1) left=i+1;
            else {
                int L=max(L1,L2);
                int R=min(R1,R2);
                if ((len1+len2)%2==0) return (L+R)/2.0;
                else return L;
            }
        }
        return 0.0;
    }
};
```

## 2140解决智力问题

* 问题：对于每个题，有得分但每选择做一题会不能做后续的若干题。两项信息存储在专门的数组中
* 思路：
  * 首先，对于动态规划，必定有一个状态转移的过程。那么，从哪里转移？由于会导致若干后续题目做不了，那么一种好的做法是从后向前进行操作
  * 对于从后向前的接法，因此遍历每个题目时自然产生了做与不做两种选项。也就可以相应求出不同的选择对应的分数，选取其中的较高分数

```cpp
class Solution {
public:
    long long mostPoints(vector<vector<int>>& questions) {
        int len=questions.size();
        vector<long long> dp(len+1,0);
        for (int i=len-1;i>=0;i--) {
            int points=questions[i][0];
            int brainpower=questions[i][1];
            int next=min(len,i+brainpower+1);
            long long skip=dp[i+1];
            long long solve=dp[next]+points;
            dp[i]=max(skip,solve);
        }
        return dp[0];
    }
};
```

## 2333最小的差值平方和

```cpp
class Solution {
public:
    long long minSumSquareDiff(vector<int>& nums1, vector<int>& nums2, int k1, int k2) {
        int len=nums1.size();
        vector<int> dif(len,0);
        long long ans=0,sum=0;
        for (int i=0;i<len;i++) {
            dif[i]=abs(nums1[i]-nums2[i]);
            ans+=1LL*dif[i]*dif[i];
            sum+=1LL*dif[i];
        }
        ranges::sort(dif,greater());
        dif.push_back(0);
        long long k=1LL*(k1+k2);
        if (k>=sum) return 0;
        for (int i=0;;i++) {
            long long cur=dif[i];
            int j=i+1;
            ans-=cur*cur;
            long long op=j*(cur-dif[j]);
            if (op<k) {
                k-=op;
                continue;
            }
            cur-=k/j;
            return ans+k%j*(cur-1)*(cur-1)+(j-k%j)*cur*cur;
        }
    }
};
```

​
