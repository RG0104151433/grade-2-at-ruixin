class Solution {
public:
    vector<int> asteroidCollision(vector<int>& asteroids) {
        vector<int> stk;
        for (int a:asteroids) {
            if (stk.empty() || a>0 || (a<0 && stk.back()<0)) stk.push_back(a); // 注意负数也有可能可以直接入栈
            else {
                bool alive=true; // 到后面会发现需要一个变量来维护该小行星是否爆炸
                while (!stk.empty() && stk.back()>0) {
                    int len=stk.size();
                    if (stk[len-1]>0 && a+stk[len-1]<0) stk.pop_back(); // 把前面的炸碎了，但是不是死了，前面的还要炸
                    else if (a+stk[len-1]==0) {
                        stk.pop_back(); // 一换一了
                        alive=false; // 也就是死了
                        break;
                    }
                    else {
                        alive=false; // 安静地死了
                        break;
                    }
                }
                if (alive) stk.push_back(a); // 能不能进去就取决于这个alive变量
            }
        }
        return stk;
    }
};
