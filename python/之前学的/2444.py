class Solution:
    def countSubarrays(self, nums: List[int], minK: int, maxK: int) -> int:
        minP,maxP=-1,-1
        out=-1
        ans=0
        for i,n in enumerate(nums) : 
            # ber这个i,n是什么玩意啊？
            if n==minK :
                minP=i
            if n==maxK :
                maxP=i
            if not minK<=n<=maxK :
                out=i
            ans+=max(0,min(minP,maxP)-out)
        return ans